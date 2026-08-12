// PWA simgelerini bağımlılıksız üretir (public/icon-*.png).
// Çalıştırmak için: npm run gen:icons

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CIKTI = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const CRC_TABLOSU = (() => {
  const tablo = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tablo[i] = c >>> 0;
  }
  return tablo;
})();

function crc32(veri) {
  let c = 0xffffffff;
  for (const bayt of veri) c = CRC_TABLOSU[(c ^ bayt) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function parca(tur, govde) {
  const uzunluk = Buffer.alloc(4);
  uzunluk.writeUInt32BE(govde.length);
  const etiketliGovde = Buffer.concat([Buffer.from(tur, 'ascii'), govde]);
  const kontrol = Buffer.alloc(4);
  kontrol.writeUInt32BE(crc32(etiketliGovde));
  return Buffer.concat([uzunluk, etiketliGovde, kontrol]);
}

/** RGBA piksel tamponunu PNG dosyasına çevirir. */
function pngYaz(genislik, yukseklik, pikseller) {
  const baslik = Buffer.alloc(13);
  baslik.writeUInt32BE(genislik, 0);
  baslik.writeUInt32BE(yukseklik, 4);
  baslik[8] = 8; // bit derinliği
  baslik[9] = 6; // RGBA
  const satirlar = Buffer.alloc((genislik * 4 + 1) * yukseklik);
  for (let y = 0; y < yukseklik; y += 1) {
    const hedef = y * (genislik * 4 + 1);
    satirlar[hedef] = 0; // filtre yok
    pikseller.copy(satirlar, hedef + 1, y * genislik * 4, (y + 1) * genislik * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    parca('IHDR', baslik),
    parca('IDAT', deflateSync(satirlar, { level: 9 })),
    parca('IEND', Buffer.alloc(0)),
  ]);
}

const karistir = (a, b, t) => a + (b - a) * t;

/** Yuvarlatılmış kare içinde mi? */
function yuvarlakKaredeMi(x, y, boyut, yaricap) {
  const ix = Math.min(Math.max(x, yaricap), boyut - yaricap);
  const iy = Math.min(Math.max(y, yaricap), boyut - yaricap);
  return (x - ix) ** 2 + (y - iy) ** 2 <= yaricap ** 2;
}

/** Mikrofon çizimi — 0..1 aralığında oranlarla tanımlı. */
function mikrofondaMi(x, y, boyut, olcek) {
  const merkez = boyut / 2;
  const ox = (x - merkez) / olcek + merkez;
  const oy = (y - merkez) / olcek + merkez;
  const b = boyut;

  // gövde: kapsül (yarıçapı yarı genişliğine eşit yuvarlatılmış dikdörtgen)
  const yariGenislik = b * 0.1;
  const govdeUst = b * 0.2 + yariGenislik;
  const govdeAlt = b * 0.52 - yariGenislik;
  const yatayUzaklik = Math.abs(ox - merkez);
  const dikeyUzaklik =
    oy < govdeUst ? govdeUst - oy : oy > govdeAlt ? oy - govdeAlt : 0;
  if (Math.hypot(yatayUzaklik, dikeyUzaklik) <= yariGenislik) return true;

  // yay: alt yarım halka
  const yayMerkezi = b * 0.5;
  const uzaklik = Math.hypot(ox - merkez, oy - yayMerkezi);
  if (oy >= yayMerkezi && uzaklik <= b * 0.24 && uzaklik >= b * 0.185) return true;

  // sap
  if (Math.abs(ox - merkez) <= b * 0.022 && oy >= b * 0.72 && oy <= b * 0.8) return true;

  // taban
  if (Math.abs(ox - merkez) <= b * 0.12 && oy >= b * 0.8 && oy <= b * 0.84) return true;

  return false;
}

function simgeUret(boyut, { maskable = false } = {}) {
  const pikseller = Buffer.alloc(boyut * boyut * 4);
  const yaricap = maskable ? 0 : boyut * 0.22;
  const icerikOlcegi = maskable ? 1 / 0.62 : 1;
  const ornek = 3; // kenar yumuşatma için alt örnekleme

  for (let y = 0; y < boyut; y += 1) {
    for (let x = 0; x < boyut; x += 1) {
      let zemin = 0;
      let onPlan = 0;

      for (let sy = 0; sy < ornek; sy += 1) {
        for (let sx = 0; sx < ornek; sx += 1) {
          const px = x + (sx + 0.5) / ornek;
          const py = y + (sy + 0.5) / ornek;
          const icerideMi = yaricap ? yuvarlakKaredeMi(px, py, boyut, yaricap) : true;
          if (!icerideMi) continue;
          zemin += 1;
          if (mikrofondaMi(px, py, boyut, icerikOlcegi)) onPlan += 1;
        }
      }

      const toplam = ornek * ornek;
      const alfa = zemin / toplam;
      const beyaz = onPlan / toplam;
      const t = y / boyut;
      const r = karistir(79, 124, t);
      const g = karistir(70, 58, t);
      const b = karistir(229, 237, t);

      const konum = (y * boyut + x) * 4;
      pikseller[konum] = Math.round(karistir(r, 255, beyaz));
      pikseller[konum + 1] = Math.round(karistir(g, 255, beyaz));
      pikseller[konum + 2] = Math.round(karistir(b, 255, beyaz));
      pikseller[konum + 3] = Math.round(alfa * 255);
    }
  }

  return pngYaz(boyut, boyut, pikseller);
}

mkdirSync(CIKTI, { recursive: true });
writeFileSync(join(CIKTI, 'icon-192.png'), simgeUret(192));
writeFileSync(join(CIKTI, 'icon-512.png'), simgeUret(512));
writeFileSync(join(CIKTI, 'icon-maskable-512.png'), simgeUret(512, { maskable: true }));
console.log('Simgeler üretildi: public/icon-192.png, icon-512.png, icon-maskable-512.png');
