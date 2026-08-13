// Claude'un ürettiği not taslağını doğrular, tamamlar ve dosyaya yazar.
//
//   not.json + hazirlik.json
//     → doğrula (Arapça sızıntısı, geçersiz yer tutucu, atlanan alıntı)
//     → Arapça parçaları yerine koy
//     → numaralandır, ekleri (tanım/âyet/hadîs dizinleri) türet
//     → .md  ve  .docx  yaz
//
// Doğrulama adımı isteğe bağlı değildir: modelin Arapça metne dokunmadığını
// burada kanıtlıyoruz. Sızıntı bulunursa dosya yazılmaz, süreç hata verir.
//
// Kullanım:
//   node scripts/not-yaz.mjs not.json hazirlik.json [cikti-koku]

import { readFile, writeFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

import { numaralandir } from '../src/turkce/taslak.js';
import { ekleriTazele } from '../src/turkce/duzenle.js';
import { markdownYaz } from '../src/turkce/bicim.js';
import { wordBelgesiKur } from '../src/core/word.js';

const ARAP_HARFI = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/u;
const YER_TUTUCU = /⟦(AR:\d+)⟧/gu;

/** Windows düzenleyicileri dosya başına BOM koyar; JSON.parse bunu kabul etmez. */
async function jsonOku(yol) {
  const ham = await readFile(yol, 'utf8');
  return JSON.parse(ham.replace(/^﻿/, ''));
}

/** Not ağacındaki her maddeyi (alt maddeler dahil) dolaşır. */
function* maddeleriGez(not) {
  for (const bolum of not.bolumler || []) {
    for (const grup of bolum.gruplar || []) {
      for (const madde of grup.maddeler || []) {
        yield madde;
        for (const alt of madde.alt || []) yield alt;
      }
    }
  }
}

/** Notun tüm serbest metin alanlarını tek listede toplar. */
function tumMetinler(not) {
  const metinler = [];
  for (const madde of maddeleriGez(not)) {
    if (madde.metin) metinler.push({ yer: `madde ${madde.id || '?'}`, metin: madde.metin });
  }
  for (const bolum of not.bolumler || []) {
    if (bolum.baslik) metinler.push({ yer: `bölüm başlığı`, metin: bolum.baslik });
    for (const grup of bolum.gruplar || []) {
      if (grup.baslik) metinler.push({ yer: `grup başlığı`, metin: grup.baslik });
    }
  }
  for (const alan of ['ozet', 'sorular']) {
    for (const satir of not[alan] || []) metinler.push({ yer: alan, metin: satir });
  }
  if (not.baslik) metinler.push({ yer: 'not başlığı', metin: not.baslik });
  return metinler;
}

/**
 * Modelin Arapça metne dokunmadığını denetler.
 * @returns {string[]} hata listesi (boşsa temiz)
 */
function arapcayiDenetle(not, arapca) {
  const hatalar = [];
  const tanimli = new Set(Object.keys(arapca));
  const kullanilan = new Set();

  for (const { yer, metin } of tumMetinler(not)) {
    // 1) Yer tutucu dışında ham Arapça harf görünmemeli.
    const yerTutucusuz = metin.replace(YER_TUTUCU, '');
    if (ARAP_HARFI.test(yerTutucusuz)) {
      hatalar.push(
        `${yer}: yer tutucu yerine ham Arapça metin var — model alıntıya dokunmuş. ` +
          `«${yerTutucusuz.slice(0, 60)}»`,
      );
    }
    // 2) Kullanılan yer tutucular tanımlı olmalı.
    for (const esles of metin.matchAll(YER_TUTUCU)) {
      const anahtar = esles[1];
      kullanilan.add(anahtar);
      if (!tanimli.has(anahtar)) {
        hatalar.push(`${yer}: tanımsız yer tutucu ⟦${anahtar}⟧ — model uydurmuş.`);
      }
    }
  }

  const dusen = [...tanimli].filter((a) => !kullanilan.has(a));
  return { hatalar, dusen };
}

/** Yer tutucuları orijinal Arapça metinlerle değiştirir. */
function arapcayiGeriKoy(not, arapca) {
  const coz = (metin) =>
    String(metin).replace(YER_TUTUCU, (tam, anahtar) => arapca[anahtar] ?? tam);

  for (const madde of maddeleriGez(not)) {
    if (madde.metin) madde.metin = coz(madde.metin);
  }
  for (const bolum of not.bolumler || []) {
    if (bolum.baslik) bolum.baslik = coz(bolum.baslik);
    for (const grup of bolum.gruplar || []) {
      if (grup.baslik) grup.baslik = coz(grup.baslik);
    }
  }
  for (const alan of ['ozet', 'sorular']) {
    if (Array.isArray(not[alan])) not[alan] = not[alan].map(coz);
  }
  if (not.baslik) not.baslik = coz(not.baslik);
  return not;
}

/** Eksik alanları hazırlık verisinden tamamlar. */
function notuTamamla(not, hazirlik) {
  const maddeSayisi = [...maddeleriGez(not)].length;
  const kaynaklar = [...maddeleriGez(not)]
    .map((m) => m.kaynak)
    .filter((k) => typeof k === 'number');

  return {
    baslik: not.baslik || 'Ders Notu',
    tarih: not.tarih || new Date().toISOString(),
    sure: not.sure || 0,
    sonKaynak: kaynaklar.length ? Math.max(...kaynaklar) : -1,
    istatistik: {
      cumle: hazirlik.istatistik.cumle,
      kelime: hazirlik.istatistik.kelime,
      madde: maddeSayisi,
    },
    bolumler: not.bolumler || [],
    tanimlar: [],
    onemliler: [],
    sorular: not.sorular || [],
    ozet: not.ozet || [],
    ayetler: [],
    hadisler: [],
    dualar: [],
    gorusler: [],
    anahtarlar: not.anahtarlar || [],
    atlanan: [],
    elleDuzenlendi: false,
  };
}

/** Yerel motorun bulduklarıyla karşılaştırıp sessiz kayıpları bildirir. */
function caprazDogrula(not, olcut) {
  const uyarilar = [];
  const kiyas = [
    ['âyet', not.ayetler.length, olcut.ayet],
    ['hadîs', not.hadisler.length, olcut.hadis],
    ['duâ', not.dualar.length, olcut.dua],
    ['görüş', not.gorusler.length, olcut.gorus],
  ];
  for (const [ad, bizim, yerel] of kiyas) {
    if (yerel > 0 && bizim < yerel) {
      uyarilar.push(`${ad}: yerel motor ${yerel} buldu, notta ${bizim} var — ${yerel - bizim} tanesi düşmüş olabilir.`);
    }
  }
  return uyarilar;
}

function dosyaAdi(baslik) {
  return (
    String(baslik || 'ders-notu')
      .toLocaleLowerCase('tr')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'ders-notu'
  );
}

async function main() {
  const [notYolu, hazirlikYolu, kokArg] = process.argv.slice(2);
  if (!notYolu || !hazirlikYolu) {
    console.error('Kullanım: node scripts/not-yaz.mjs <not.json> <hazirlik.json> [cikti-koku]');
    process.exit(1);
  }

  const ham = await jsonOku(notYolu);
  const hazirlik = await jsonOku(hazirlikYolu);
  const arapca = hazirlik.arapca || {};

  // 1) Denetim — Arapça sızıntısı varsa hiçbir şey yazılmaz.
  const { hatalar, dusen } = arapcayiDenetle(ham, arapca);
  if (hatalar.length) {
    console.error('\nDOĞRULAMA BAŞARISIZ — Arapça koruma ihlali:\n');
    for (const hata of hatalar) console.error(`  · ${hata}`);
    console.error('\nNot yazılmadı. Yapılandırma adımı yer tutucu kuralına uyularak tekrarlanmalı.');
    process.exit(2);
  }

  // 2) Tamamla, Arapça'yı yerine koy, numaralandır, ekleri türet.
  let not = notuTamamla(ham, hazirlik);
  not = arapcayiGeriKoy(not, arapca);
  numaralandir(not.bolumler);
  not = ekleriTazele(not);
  not.elleDuzenlendi = false; // ekleriTazele üzerinden gelen bayrağı sıfırla

  // 3) Uyarılar — engelleyici değil, bilgilendirici.
  const uyarilar = caprazDogrula(not, hazirlik.yerelOlcut || {});
  if (dusen.length) {
    uyarilar.push(
      `${dusen.length} Arapça parça hiç kullanılmamış (${dusen.slice(0, 5).join(', ')}` +
        `${dusen.length > 5 ? '…' : ''}) — atlanmış alıntı olabilir.`,
    );
  }

  // 4) Yaz.
  const kok = kokArg || `${basename(notYolu, extname(notYolu))}`;
  const md = markdownYaz(not);
  await writeFile(`${kok}.md`, md, 'utf8');

  const belge = await wordBelgesiKur(not);
  const { Packer } = await import('docx');
  await writeFile(`${kok}.docx`, await Packer.toBuffer(belge));

  console.log(`Not yazıldı:`);
  console.log(`  ${kok}.md`);
  console.log(`  ${kok}.docx`);
  console.log(
    `  ${not.bolumler.length} bölüm · ${not.istatistik.madde} madde · ` +
      `${not.ayetler.length} âyet · ${not.hadisler.length} hadîs · ${not.tanimlar.length} tanım`,
  );
  console.log(`  Arapça koruma: ${Object.keys(arapca).length} parça, sızıntı yok ✓`);

  if (uyarilar.length) {
    console.log('\nUyarılar:');
    for (const uyari of uyarilar) console.log(`  · ${uyari}`);
  }
}

main().catch((sorun) => {
  console.error(`\nHata: ${sorun.message}`);
  process.exit(1);
});
