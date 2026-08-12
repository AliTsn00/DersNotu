// Cihazda saklanan derslerin listesi.

import { tarihYaz, sureYaz } from '../turkce/bicim.js';
import { Dugme, Kart, BosDurum, Etiket } from './parcalar.jsx';

export default function ArsivEkrani({ dersler, ac, sil }) {
  if (!dersler.length) {
    return (
      <Kart>
        <BosDurum
          baslik="Arşiv boş"
          aciklama="Bir dersi not sekmesinden kaydettiğinizde burada listelenir. Tüm kayıtlar yalnızca bu cihazda durur."
        />
      </Kart>
    );
  }

  return (
    <ul className="space-y-2">
      {dersler.map((ders) => (
        <li key={ders.id}>
          <Kart className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => ac(ders)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                {ders.baslik}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {tarihYaz(ders.tarih)}
                {ders.sure ? ` · ${sureYaz(ders.sure)}` : ''}
                {` · ${ders.maddeSayisi} madde`}
              </p>
            </button>
            <Etiket>{ders.detay}</Etiket>
            <Dugme
              cesit="tehlike"
              boyut="kucuk"
              onClick={() => sil(ders.id)}
              aria-label={`${ders.baslik} dersini sil`}
            >
              Sil
            </Dugme>
          </Kart>
        </li>
      ))}
    </ul>
  );
}
