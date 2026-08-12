// Üretilen notu gösteren ve dışa aktaran ekran.

import { useState } from 'react';
import { markdownYaz, duzMetinYaz } from '../turkce/bicim.js';
import {
  markdownIndir,
  metinIndir,
  panoyaKopyala,
  pdfOlarakYazdir,
} from '../core/disaAktar.js';
import NotGovdesi from './NotGovdesi.jsx';
import { Dugme, Kart, BosDurum } from './parcalar.jsx';

const DETAY_SECENEKLERI = [
  { id: 'kisa', ad: 'Kısa' },
  { id: 'orta', ad: 'Orta' },
  { id: 'detayli', ad: 'Detaylı' },
];

export default function NotEkrani({ not, detay, detayDegistir, kaydet, kayitliMi }) {
  const [bildirim, bildirimYaz] = useState('');

  const bildir = (mesaj) => {
    bildirimYaz(mesaj);
    setTimeout(() => bildirimYaz(''), 2500);
  };

  if (!not || !not.bolumler.length) {
    return (
      <Kart>
        <BosDurum
          baslik="Not henüz oluşmadı"
          aciklama="Kayıt sekmesinden dersi dinletin ya da metni yapıştırın; cümleler geldikçe not burada maddelenir."
        />
      </Kart>
    );
  }

  return (
    <div className="space-y-4">
      <Kart className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Ayrıntı seviyesi"
          className="flex rounded-xl bg-zinc-100 p-0.5 dark:bg-zinc-800"
        >
          {DETAY_SECENEKLERI.map((secenek) => (
            <button
              key={secenek.id}
              type="button"
              onClick={() => detayDegistir(secenek.id)}
              aria-pressed={detay === secenek.id}
              className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors ${
                detay === secenek.id
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              {secenek.ad}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap gap-1.5">
          <Dugme
            boyut="kucuk"
            onClick={async () => {
              const oldu = await panoyaKopyala(duzMetinYaz(not));
              bildir(oldu ? 'Not panoya kopyalandı.' : 'Kopyalanamadı.');
            }}
          >
            Kopyala
          </Dugme>
          <Dugme
            boyut="kucuk"
            onClick={async () => {
              const oldu = await panoyaKopyala(markdownYaz(not));
              bildir(oldu ? 'Markdown kopyalandı.' : 'Kopyalanamadı.');
            }}
          >
            Markdown
          </Dugme>
          <Dugme boyut="kucuk" onClick={() => markdownIndir(not)}>
            .md
          </Dugme>
          <Dugme boyut="kucuk" onClick={() => metinIndir(not)}>
            .txt
          </Dugme>
          <Dugme
            boyut="kucuk"
            onClick={() => {
              if (!pdfOlarakYazdir(not)) bildir('Yazdırma penceresi engellendi.');
            }}
          >
            PDF
          </Dugme>
          <Dugme
            cesit="ana"
            boyut="kucuk"
            onClick={async () => {
              await kaydet();
              bildir('Ders arşive kaydedildi.');
            }}
          >
            {kayitliMi ? 'Güncelle' : 'Kaydet'}
          </Dugme>
        </div>

        {bildirim ? (
          <p
            role="status"
            className="w-full text-xs text-emerald-600 dark:text-emerald-400"
          >
            {bildirim}
          </p>
        ) : null}
      </Kart>

      <Kart className="p-5 sm:p-7">
        <NotGovdesi not={not} />
      </Kart>

      {not.atlanan.length ? (
        <details className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <summary className="cursor-pointer font-medium text-zinc-700 dark:text-zinc-200">
            Nota alınmayan {not.atlanan.length} cümle
          </summary>
          <ul className="mt-2 space-y-1 text-zinc-500 dark:text-zinc-400">
            {not.atlanan.map((metin, sira) => (
              <li key={sira}>· {metin}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
