// Ham transkripti, Claude'un yapılandırmasına hazır hâle getirir.
//
//   ham metin → dolgu temizliği → cümlelere ayır → noktalama onar
//             → Arapça parçaları çıkar ve yer tutucuya çevir
//             → numaralı cümle listesi + yerel motorun kendi çıktısı
//
// Arapça parçaların çıkarılması bir güvenlik önlemidir: model Arapça metni
// hiç görmediği için düzeltemez, tamamlayamaz, ezberden değiştiremez.
// Yer tutucular `not-yaz.mjs` tarafından orijinalleriyle geri konur.
//
// Kullanım:
//   node scripts/on-isle.mjs ham.txt [hazirlik.json]

import { readFile, writeFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

import { metniTemizle } from '../src/turkce/temizle.js';
import { cumleleriAyir } from '../src/turkce/cumle.js';
import { cumleyiBicimle } from '../src/turkce/noktalama.js';
import { cumleyiSiniflandir } from '../src/turkce/siniflandir.js';
import {
  alintilariIsaretle,
  cevrimyaziMi,
  arapcaMi,
} from '../src/turkce/islami.js';
import { notCikar } from '../src/turkce/index.js';
import { ALINTI_TURLERI } from '../src/turkce/taslak.js';

// Arapça harf blokları: temel, ek, sunum biçimleri ve harekeler.
const ARAPCA_BLOK =
  /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+(?:[\sً-ٰٟ]+[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+)*/gu;

/**
 * Metindeki Arapça parçaları yer tutucuyla değiştirir.
 * @returns {{metin:string, bulunan:Array<{anahtar:string, metin:string}>}}
 */
function arapcayiCikar(metin, sayac) {
  const bulunan = [];
  const yeni = metin.replace(ARAPCA_BLOK, (parca) => {
    const anahtar = `AR:${sayac.deger++}`;
    bulunan.push({ anahtar, metin: parca.trim() });
    return `⟦${anahtar}⟧`;
  });
  return { metin: yeni, bulunan };
}

async function main() {
  const [girdi, ciktiArg] = process.argv.slice(2);
  if (!girdi) {
    console.error('Kullanım: node scripts/on-isle.mjs <ham.txt> [hazirlik.json]');
    process.exit(1);
  }

  const cikti = ciktiArg || `${basename(girdi, extname(girdi))}.hazirlik.json`;
  // Windows düzenleyicileri dosya başına BOM koyabilir; ilk cümleyi bozar.
  const ham = (await readFile(girdi, 'utf8')).replace(/^﻿/, '');

  // 1) Yerel motorun kendi notu — hem çevrimdışı yedek hem çapraz doğrulama
  //    ölçütü. Claude'un kaç âyet/hadîs atladığı buradan anlaşılır.
  const yerel = notCikar(ham, { detay: 'detayli' });

  // 2) Claude'a verilecek cümle listesi, motorun ilk üç adımıyla aynı yoldan
  //    geçer; böylece `kaynak` indeksleri yerel notunkiyle birebir örtüşür.
  const temiz = metniTemizle(ham, { dolgu: true });
  const bicimli = cumleleriAyir(temiz).map(cumleyiBicimle).filter(Boolean);
  const siniflar = alintilariIsaretle(bicimli.map(cumleyiSiniflandir));

  const sayac = { deger: 0 };
  const arapca = {};
  const cumleler = siniflar.map((sinif, i) => {
    const { metin, bulunan } = arapcayiCikar(sinif.metin, sayac);
    for (const { anahtar, metin: asil } of bulunan) arapca[anahtar] = asil;

    // Latin harfleriyle yazılmış Arapça (çevriyazı) yer tutucuya alınmaz —
    // alınırsa cümlenin tamamı kaybolur ve bağlam kopar. Bunun yerine
    // "harfiyen korunacak" diye işaretlenir.
    //
    // İki ölçüt birden kullanılır: `cevrimyaziMi` harf örüntüsüne bakar ama
    // "Bismillahirrahmanirrahim" gibi tek kelimelik ibarelerde yanılır;
    // alıntı olarak sınıflanmış her cümle de bu yüzden korumaya alınır.
    const korunacak =
      bulunan.length === 0 && (cevrimyaziMi(sinif.metin) || ALINTI_TURLERI.has(sinif.tur));

    return {
      i,
      metin,
      ipucu: sinif.tur,
      ...(sinif.kaynak ? { kunye: sinif.kaynak } : {}),
      ...(korunacak ? { korunacak: true } : {}),
      ...(bulunan.length ? { arapcaIcerir: true } : {}),
    };
  });

  const hazirlik = {
    kaynakDosya: girdi,
    uretim: new Date().toISOString(),
    istatistik: {
      cumle: cumleler.length,
      kelime: yerel.istatistik.kelime,
      arapcaParca: Object.keys(arapca).length,
      korunacakCumle: cumleler.filter((c) => c.korunacak).length,
    },
    // Claude'un atladığını yakalamak için ölçüt sayılar.
    yerelOlcut: {
      baslik: yerel.baslik,
      bolum: yerel.bolumler.length,
      ayet: yerel.ayetler.length,
      hadis: yerel.hadisler.length,
      dua: yerel.dualar.length,
      gorus: yerel.gorusler.length,
      tanim: yerel.tanimlar.length,
    },
    arapca,
    cumleler,
  };

  await writeFile(cikti, JSON.stringify(hazirlik, null, 2), 'utf8');

  console.log(`Hazırlık: ${cikti}`);
  console.log(
    `  ${cumleler.length} cümle · ${Object.keys(arapca).length} Arapça parça korumaya alındı`,
  );
  console.log(
    `  Yerel motor ölçütü: ${yerel.ayetler.length} âyet, ${yerel.hadisler.length} hadîs, ` +
      `${yerel.gorusler.length} görüş, ${yerel.tanimlar.length} tanım`,
  );
  if (yerel.bolumler.length) console.log(`  Yerel başlık önerisi: ${yerel.baslik}`);
  // arapcaMi yalnızca bilgi amaçlı: tamamı Arapça olan cümleleri sayar.
  const tamArapca = siniflar.filter((s) => arapcaMi(s.metin)).length;
  if (tamArapca) console.log(`  Tamamı Arapça olan cümle: ${tamArapca}`);
}

main().catch((sorun) => {
  console.error(`\nHata: ${sorun.message}`);
  process.exit(1);
});
