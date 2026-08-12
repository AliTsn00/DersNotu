// Not nesnesini dışa aktarım biçimlerine çevirir (Markdown / düz metin).

import { DOGRULAMA_UYARISI, dogrulamaUyarisiGerekliMi } from './islami.js';

const AY_BICIMI = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function tarihYaz(isoTarih) {
  const tarih = new Date(isoTarih);
  if (Number.isNaN(tarih.getTime())) return '';
  return AY_BICIMI.format(tarih);
}

export function sureYaz(saniye = 0) {
  const toplam = Math.max(0, Math.round(saniye));
  const dakika = Math.floor(toplam / 60);
  if (dakika < 1) return `${toplam} sn`;
  const saat = Math.floor(dakika / 60);
  if (saat < 1) return `${dakika} dk`;
  return `${saat} sa ${dakika % 60} dk`;
}

/** Madde türlerinin görünen etiketleri. */
export const TUR_ETIKETLERI = {
  ayet: { simge: '📖', ad: 'Âyet' },
  hadis: { simge: '🕌', ad: 'Hadîs' },
  dua: { simge: '🤲', ad: 'Duâ' },
  arapca: { simge: '✒️', ad: 'Arapça ibare' },
  gorus: { simge: '⚖️', ad: 'Görüş' },
  onemli: { simge: '⚠️', ad: 'Önemli' },
  meal: { simge: '', ad: 'Meâli' },
};

/** Bir maddenin metnini, türüne göre önekleyerek yazar. */
export function maddeMetni(madde) {
  const etiket = TUR_ETIKETLERI[madde.tur];
  const kunye = madde.kaynakKunyesi ? ` · ${madde.kaynakKunyesi}` : '';

  switch (madde.tur) {
    case 'ayet':
    case 'hadis':
    case 'dua':
    case 'arapca':
      return `${etiket.simge} **${etiket.ad}${kunye}:** «${madde.metin}»`;
    case 'gorus':
      return `${etiket.simge} **${etiket.ad}:** ${madde.metin}`;
    case 'onemli':
      return `${etiket.simge} **${etiket.ad}:** ${madde.metin}`;
    default:
      return madde.metin;
  }
}

function ustBilgi(not) {
  const parcalar = [tarihYaz(not.tarih)];
  if (not.sure) parcalar.push(sureYaz(not.sure));
  if (not.istatistik?.kelime) {
    parcalar.push(`${not.istatistik.kelime.toLocaleString('tr-TR')} kelime`);
  }
  if (not.istatistik?.madde) parcalar.push(`${not.istatistik.madde} madde`);
  if (not.elleDuzenlendi) parcalar.push('elle düzenlendi');
  return parcalar.filter(Boolean).join(' · ');
}

function maddeSatirlari(madde) {
  const satirlar = [`- **${madde.numara}** ${maddeMetni(madde)}`];
  for (const alt of madde.alt || []) {
    satirlar.push(`  - ${alt.numara ? `**${alt.numara}** ` : ''}${maddeMetni(alt)}`);
  }
  return satirlar;
}

/** Bölüm başlıklarından içindekiler listesi. */
export function icindekiler(not) {
  return not.bolumler.map((bolum) => `${bolum.numara}. ${bolum.baslik}`);
}

function alintiBolumu(satirlar, baslik, kayitlar) {
  if (!kayitlar?.length) return;
  satirlar.push(`## ${baslik}`, '');
  for (const kayit of kayitlar) {
    satirlar.push(`- ${kayit.kunye ? `**${kayit.kunye}** — ` : ''}«${kayit.metin}»`);
    if (kayit.meal) satirlar.push(`  - Meâli: ${kayit.meal}`);
  }
  satirlar.push('');
}

export function markdownYaz(not) {
  const satirlar = [`# ${not.baslik}`, '', `_${ustBilgi(not)}_`, ''];

  if (dogrulamaUyarisiGerekliMi(not)) {
    satirlar.push(`> ⚠️ ${DOGRULAMA_UYARISI}`, '');
  }

  if (not.bolumler.length > 1) {
    satirlar.push('## İçindekiler', '');
    for (const satir of icindekiler(not)) satirlar.push(`- ${satir}`);
    satirlar.push('');
  }

  for (const bolum of not.bolumler) {
    satirlar.push(`## ${bolum.numara}. ${bolum.baslik}`, '');
    for (const grup of bolum.gruplar) {
      if (grup.baslik) satirlar.push(`### ${grup.baslik}`, '');
      for (const madde of grup.maddeler) satirlar.push(...maddeSatirlari(madde));
      satirlar.push('');
    }
  }

  if (not.tanimlar.length) {
    satirlar.push('## Tanımlar', '');
    for (const { terim, aciklama } of not.tanimlar) {
      satirlar.push(`- **${terim}** — ${aciklama.replace(/[.?!]$/, '')}.`);
    }
    satirlar.push('');
  }

  alintiBolumu(satirlar, 'Geçen Âyetler', not.ayetler);
  alintiBolumu(satirlar, 'Geçen Hadîsler', not.hadisler);
  alintiBolumu(satirlar, 'Duâlar', not.dualar);

  if (not.gorusler?.length) {
    satirlar.push('## Görüşler ve İhtilaflar', '');
    for (const metin of not.gorusler) satirlar.push(`- ${metin}`);
    satirlar.push('');
  }

  if (not.onemliler.length) {
    satirlar.push('## Sınavda Çıkabilir', '');
    for (const metin of not.onemliler) satirlar.push(`- ${metin}`);
    satirlar.push('');
  }

  if (not.ozet.length) {
    satirlar.push('## Özet', '');
    for (const metin of not.ozet) satirlar.push(`- ${metin}`);
    satirlar.push('');
  }

  if (not.sorular.length) {
    satirlar.push('## Cevaplanacak Sorular', '');
    for (const metin of not.sorular) satirlar.push(`- [ ] ${metin}`);
    satirlar.push('');
  }

  if (not.anahtarlar.length) {
    satirlar.push('## Anahtar Kavramlar', '');
    satirlar.push(not.anahtarlar.map((a) => `\`${a.kelime}\``).join(' '));
    satirlar.push('');
  }

  return `${satirlar.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

export function duzMetinYaz(not) {
  return markdownYaz(not)
    .replace(/^#{1,6} /gm, '')
    .replace(/^> /gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^- \[ \] /gm, '□ ')
    .replace(/^(\s*)- /gm, '$1• ');
}
