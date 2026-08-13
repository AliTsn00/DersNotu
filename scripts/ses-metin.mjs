// Ders sesini Türkçe ham metne çevirir.
//
//   ses dosyası → ffmpeg (16 kHz mono, süreye göre hesaplanmış bitrate)
//               → Groq Whisper large-v3 → düz metin
//
// Groq'un ücretsiz katmanında dosya sınırı 25 MB olduğu için bitrate sabit
// değil: kaydın süresine bakılıp hedef boyuta sığacak şekilde hesaplanır.
// 90 dakikalık bir ders ~32 kbps ile ~22 MB eder.
//
// Kullanım:
//   node scripts/ses-metin.mjs ders.m4a [cikti.txt]
//
// Gerekenler:
//   GROQ_API_KEY   ortam değişkeni (console.groq.com)
//   ffmpeg, ffprobe   PATH üzerinde

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { tmpdir } from 'node:os';

const calistir = promisify(execFile);

const UC_NOKTA = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = 'whisper-large-v3';
const HEDEF_BAYT = 22 * 1024 * 1024; // 25 MB sınırının altında güvenli pay
const EN_DUSUK_BITRATE = 16_000;
const EN_YUKSEK_BITRATE = 48_000;

// Whisper'ın `prompt` alanı talimat değil, stil örneğidir: beklenen
// terimleri içeren kısa bir metin vermek tanımayı iyileştirir. 224 token
// sınırı olduğu için liste kısa tutulur; geri kalan düzeltme Claude'a kalır.
const VARSAYILAN_IPUCU =
  'Bu bir Türkçe İslamî ilimler dersidir. Bakara sûresi 153. âyet, ' +
  'sallallahu aleyhi ve sellem, Buhârî, Müslim, Tirmizî, İmam Gazâlî, ' +
  'tefsir, fıkıh, usûl, hadîs-i şerîf, âyet-i kerîme, meâl, mezhep, Hanefî.';

/** Ses dosyasının uzunluğunu saniye cinsinden döndürür. */
async function sureBul(dosya) {
  try {
    const { stdout } = await calistir('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      dosya,
    ]);
    const sure = Number.parseFloat(stdout.trim());
    if (!Number.isFinite(sure) || sure <= 0) throw new Error('süre okunamadı');
    return sure;
  } catch (sorun) {
    if (sorun.code === 'ENOENT') {
      throw new Error(
        'ffprobe bulunamadı. ffmpeg kurulu değilse: https://ffmpeg.org/download.html',
      );
    }
    throw new Error(`Ses dosyasının süresi okunamadı: ${sorun.message}`);
  }
}

/** Hedef boyuta sığacak bitrate'i seçer. */
function bitrateSec(sureSaniye) {
  const ham = Math.floor((HEDEF_BAYT * 8) / sureSaniye);
  const sinirli = Math.min(EN_YUKSEK_BITRATE, Math.max(EN_DUSUK_BITRATE, ham));
  return Math.floor(sinirli / 1000) * 1000; // tam kbps
}

/** Sesi 16 kHz mono MP3'e indirger; çıktı dosyasının yolunu döndürür. */
async function sikistir(girdi, bitrate) {
  const cikti = join(tmpdir(), `ders-${Date.now()}.mp3`);
  try {
    await calistir('ffmpeg', [
      '-i', girdi,
      '-ar', '16000',      // Whisper zaten 16 kHz'e indiriyor
      '-ac', '1',          // tek kanal
      '-c:a', 'libmp3lame',
      '-b:a', `${bitrate / 1000}k`,
      '-y', cikti,
    ]);
  } catch (sorun) {
    if (sorun.code === 'ENOENT') {
      throw new Error(
        'ffmpeg bulunamadı. Kurulum: https://ffmpeg.org/download.html',
      );
    }
    throw new Error(`Ses sıkıştırılamadı: ${sorun.message}`);
  }
  return cikti;
}

/** Sıkıştırılmış sesi Groq'a gönderip ham metni alır. */
async function yaziyaCevir(dosya, ipucu) {
  const anahtar = process.env.GROQ_API_KEY;
  if (!anahtar) {
    throw new Error(
      'GROQ_API_KEY tanımlı değil. console.groq.com adresinden anahtar alıp\n' +
        '  $env:GROQ_API_KEY = "gsk_..."   (PowerShell)\n' +
        'ile tanımlayın.',
    );
  }

  const veri = await readFile(dosya);
  const govde = new FormData();
  govde.append('file', new Blob([veri], { type: 'audio/mpeg' }), 'ders.mp3');
  govde.append('model', MODEL);
  govde.append('language', 'tr');
  govde.append('response_format', 'json');
  govde.append('prompt', ipucu);

  const yanit = await fetch(UC_NOKTA, {
    method: 'POST',
    headers: { Authorization: `Bearer ${anahtar}` },
    body: govde,
  });

  if (!yanit.ok) {
    const hata = await yanit.text().catch(() => '');
    if (yanit.status === 429) {
      throw new Error(
        'Groq kota sınırı (429). Ücretsiz katmanda saatte 2 saat, günde 8 saat ses\n' +
          'işlenebiliyor. Bir süre bekleyip tekrar deneyin.\n' + hata.slice(0, 300),
      );
    }
    if (yanit.status === 413) {
      throw new Error(
        'Dosya Groq için fazla büyük (413). Ses 25 MB sınırını aşıyor;\n' +
          'kaydı bölüp parça parça çevirin.',
      );
    }
    throw new Error(`Groq isteği başarısız (${yanit.status}). ${hata.slice(0, 300)}`);
  }

  const sonuc = await yanit.json();
  return String(sonuc.text || '').trim();
}

/**
 * Konuşma tanıma çıktısı tek uzun paragraf gelir. Motorun cümle bölütlemesi
 * satır sonlarını kesin sınır saydığı için cümle sonlarında satır kırıyoruz.
 */
function satirlaraBol(metin) {
  return metin.replace(/(?<=[.!?…])\s+/g, '\n').trim();
}

async function main() {
  const [girdi, ciktiArg] = process.argv.slice(2);
  if (!girdi) {
    console.error('Kullanım: node scripts/ses-metin.mjs <ses-dosyasi> [cikti.txt]');
    process.exit(1);
  }

  const cikti = ciktiArg || `${basename(girdi, extname(girdi))}.txt`;
  const ipucu = process.env.DERS_IPUCU || VARSAYILAN_IPUCU;

  const sure = await sureBul(girdi);
  const bitrate = bitrateSec(sure);
  const dakika = Math.round(sure / 60);
  console.log(`Ses: ${dakika} dakika · hedef bitrate ${bitrate / 1000} kbps`);

  const sikistirilmis = await sikistir(girdi, bitrate);
  try {
    const { size } = await readFile(sikistirilmis).then((b) => ({ size: b.length }));
    console.log(`Sıkıştırıldı: ${(size / 1024 / 1024).toFixed(1)} MB`);
    if (size > 25 * 1024 * 1024) {
      throw new Error(
        `Sıkıştırılmış dosya hâlâ ${(size / 1024 / 1024).toFixed(1)} MB — Groq sınırı 25 MB.\n` +
          'Kaydı ikiye bölüp ayrı ayrı çevirin.',
      );
    }

    console.log('Groq Whisper large-v3 ile çevriliyor…');
    const metin = await yaziyaCevir(sikistirilmis, ipucu);
    if (!metin) throw new Error('Serviste konuşma bulunamadı.');

    await writeFile(cikti, satirlaraBol(metin), 'utf8');
    const kelime = metin.split(/\s+/).filter(Boolean).length;
    console.log(`Bitti: ${cikti} · ${kelime.toLocaleString('tr-TR')} kelime`);
  } finally {
    await unlink(sikistirilmis).catch(() => {});
  }
}

main().catch((sorun) => {
  console.error(`\nHata: ${sorun.message}`);
  process.exit(1);
});
