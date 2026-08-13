// Kur'ân metnini Tanzil.net'ten indirip uygulamanın kullanacağı biçime çevirir.
//
//   node scripts/kuran-hazirla.mjs
//
// Çıktı: public/kuran.json
//
// Tanzil'in iki sürümü birlikte indirilir; ikisi de akademik denetimden geçmiş,
// açık lisanslı metinlerdir. Uygulama bu metinlere asla dokunmaz — yalnızca
// notta geçen Arapça ibareyi onlarla karşılaştırır.
//
//   · uthmani      → kullanıcıya gösterilen resmî imlâ
//   · simple-clean → karşılaştırma temeli
//
// İkisi ayrı olmak zorunda: Uthmani imlâsı uzun elifi üst simgeyle yazıyor
// (ٱلصَّٰبِرِينَ), yaygın yazım ise elifle (الصابرين). Tek metinle arandığında
// doğru âyet bulunamıyor.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KAYNAK = (tur) =>
  `https://tanzil.net/pub/download/index.php?quranType=${tur}&outType=txt-2&agree=true`;

const BURASI = dirname(fileURLToPath(import.meta.url));
const HEDEF = resolve(BURASI, '..', 'public', 'kuran.json');

/** Sûre adları — künyede gösterilir. */
const SURE_ADLARI = [
  'Fâtiha', 'Bakara', 'Âl-i İmrân', 'Nisâ', 'Mâide', 'En\'âm', 'A\'râf', 'Enfâl',
  'Tevbe', 'Yûnus', 'Hûd', 'Yûsuf', 'Ra\'d', 'İbrâhîm', 'Hicr', 'Nahl', 'İsrâ',
  'Kehf', 'Meryem', 'Tâhâ', 'Enbiyâ', 'Hac', 'Mü\'minûn', 'Nûr', 'Furkân',
  'Şuarâ', 'Neml', 'Kasas', 'Ankebût', 'Rûm', 'Lokmân', 'Secde', 'Ahzâb', 'Sebe',
  'Fâtır', 'Yâsîn', 'Sâffât', 'Sâd', 'Zümer', 'Mü\'min', 'Fussilet', 'Şûrâ',
  'Zuhruf', 'Duhân', 'Câsiye', 'Ahkâf', 'Muhammed', 'Fetih', 'Hucurât', 'Kâf',
  'Zâriyât', 'Tûr', 'Necm', 'Kamer', 'Rahmân', 'Vâkıa', 'Hadîd', 'Mücâdele',
  'Haşr', 'Mümtehine', 'Saff', 'Cum\'a', 'Münâfikûn', 'Teğâbün', 'Talâk',
  'Tahrîm', 'Mülk', 'Kalem', 'Hâkka', 'Meâric', 'Nûh', 'Cin', 'Müzzemmil',
  'Müddessir', 'Kıyâme', 'İnsân', 'Mürselât', 'Nebe', 'Nâziât', 'Abese',
  'Tekvîr', 'İnfitâr', 'Mutaffifîn', 'İnşikâk', 'Bürûc', 'Târık', 'A\'lâ',
  'Gâşiye', 'Fecr', 'Beled', 'Şems', 'Leyl', 'Duhâ', 'İnşirâh', 'Tîn', 'Alak',
  'Kadr', 'Beyyine', 'Zilzâl', 'Âdiyât', 'Kâria', 'Tekâsür', 'Asr', 'Hümeze',
  'Fîl', 'Kureyş', 'Mâûn', 'Kevser', 'Kâfirûn', 'Nasr', 'Tebbet', 'İhlâs',
  'Felak', 'Nâs',
];

async function ayetleriCek(tur) {
  const yanit = await fetch(KAYNAK(tur));
  if (!yanit.ok) throw new Error(`Tanzil (${tur}) indirilemedi: ${yanit.status}`);
  const ham = await yanit.text();

  const ayetler = [];
  for (const satir of ham.split('\n')) {
    const temiz = satir.trim();
    // Dosyanın başındaki ve sonundaki açıklama satırları "#" ile başlar.
    if (!temiz || temiz.startsWith('#')) continue;
    const [sure, ayet, ...kalan] = temiz.split('|');
    const metin = kalan.join('|').trim();
    if (!metin || !Number(sure)) continue;
    ayetler.push({ s: Number(sure), a: Number(ayet), m: metin });
  }

  if (ayetler.length !== 6236) {
    throw new Error(
      `${tur}: beklenen 6236 âyet, gelen ${ayetler.length}. Kaynak biçimi değişmiş olabilir.`,
    );
  }
  return ayetler;
}

const [ayetler, sadeler] = await Promise.all([
  ayetleriCek('uthmani'),
  ayetleriCek('simple-clean'),
]);

// İki sürümün âyet sırası birebir aynı olmalı; olmazsa künyeler kayar.
for (let i = 0; i < ayetler.length; i += 1) {
  if (ayetler[i].s !== sadeler[i].s || ayetler[i].a !== sadeler[i].a) {
    throw new Error(`Sürümler ${i}. âyette ayrışıyor — künyeler güvenilmez olurdu.`);
  }
}

// Sûre numarası ve âyet numarası dizideki sıradan türetilebilir; her âyet için
// ayrıca saklamak dosyayı gereksiz büyütüyor. Sûre başlangıç indeksleri yeter.
const sureBasi = [];
let oncekiSure = 0;
ayetler.forEach((ayet, sira) => {
  if (ayet.s !== oncekiSure) {
    sureBasi.push(sira);
    oncekiSure = ayet.s;
  }
});

const veri = {
  kaynak: 'Tanzil.net — Uthmani (gösterim) + simple-clean (karşılaştırma)',
  lisans: 'https://tanzil.net/docs/text_license',
  surelerinAdlari: SURE_ADLARI,
  sureBasi,
  metinler: ayetler.map((ayet) => ayet.m),
  aramaMetinleri: sadeler.map((ayet) => ayet.m),
};

await mkdir(dirname(HEDEF), { recursive: true });
await writeFile(HEDEF, JSON.stringify(veri), 'utf8');

const boyut = (JSON.stringify(veri).length / 1024).toFixed(0);
console.log(`${ayetler.length} âyet yazıldı → public/kuran.json (${boyut} KB)`);
console.log(`Sûre sayısı: ${sureBasi.length}, ad sayısı: ${SURE_ADLARI.length}`);
