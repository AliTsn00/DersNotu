// Not nesnesini ekranda gösterir.

import { tarihYaz, sureYaz } from '../turkce/bicim.js';
import { Etiket } from './parcalar.jsx';

/** **kalın** işaretlemesini React düğümlerine çevirir. */
function kalinlariCoz(metin) {
  return String(metin)
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((parca, sira) =>
      parca.startsWith('**') && parca.endsWith('**') ? (
        <strong key={sira} className="font-semibold text-zinc-900 dark:text-zinc-50">
          {parca.slice(2, -2)}
        </strong>
      ) : (
        parca
      ),
    );
}

function Madde({ madde }) {
  const onemli = madde.tur === 'onemli';
  const listeMi = madde.tur === 'listeBasi';

  return (
    <li className="space-y-1.5">
      <div
        className={
          onemli
            ? 'rounded-xl border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-[15px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
            : 'text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200'
        }
      >
        {onemli ? <span className="mr-1.5 font-semibold">Önemli:</span> : null}
        {kalinlariCoz(madde.metin)}
      </div>

      {madde.alt?.length ? (
        <ul
          className={`ml-4 space-y-1 border-l border-zinc-200 pl-4 dark:border-zinc-700 ${
            listeMi ? 'list-decimal marker:text-zinc-400' : 'list-disc marker:text-zinc-300'
          }`}
        >
          {madde.alt.map((alt, sira) => (
            <li
              key={sira}
              className={`text-sm leading-relaxed ${
                alt.tur === 'ornek'
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {kalinlariCoz(alt.metin)}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function Bolum({ baslik, children, sayi }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-baseline gap-2 border-b border-zinc-200 pb-1.5 text-base font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
        {sayi ? <span className="text-zinc-400">{sayi}.</span> : null}
        {baslik}
      </h3>
      {children}
    </section>
  );
}

export default function NotGovdesi({ not }) {
  if (!not) return null;

  const ustBilgi = [
    tarihYaz(not.tarih),
    not.sure ? sureYaz(not.sure) : null,
    `${not.istatistik.kelime.toLocaleString('tr-TR')} kelime`,
    `${not.istatistik.madde} madde`,
  ].filter(Boolean);

  return (
    <article className="space-y-7">
      <header className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {not.baslik}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{ustBilgi.join(' · ')}</p>
      </header>

      {not.bolumler.map((bolum, sira) => (
        <Bolum key={`${bolum.baslik}-${sira}`} baslik={bolum.baslik} sayi={sira + 1}>
          <ul className="space-y-2.5">
            {bolum.maddeler.map((madde, i) => (
              <Madde key={i} madde={madde} />
            ))}
          </ul>
        </Bolum>
      ))}

      {not.tanimlar.length ? (
        <Bolum baslik="Tanımlar">
          <dl className="space-y-2">
            {not.tanimlar.map(({ terim, aciklama }, sira) => (
              <div
                key={sira}
                className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60"
              >
                <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {terim}
                </dt>
                <dd className="text-sm text-zinc-600 dark:text-zinc-300">{aciklama}</dd>
              </div>
            ))}
          </dl>
        </Bolum>
      ) : null}

      {not.ozet.length ? (
        <Bolum baslik="Özet">
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-zinc-700 marker:text-zinc-400 dark:text-zinc-300">
            {not.ozet.map((metin, sira) => (
              <li key={sira}>{metin}</li>
            ))}
          </ul>
        </Bolum>
      ) : null}

      {not.sorular.length ? (
        <Bolum baslik="Cevaplanacak Sorular">
          <ul className="space-y-1.5">
            {not.sorular.map((metin, sira) => (
              <li
                key={sira}
                className="flex gap-2 text-[15px] text-zinc-700 dark:text-zinc-300"
              >
                <span aria-hidden="true" className="text-zinc-400">
                  ☐
                </span>
                {metin}
              </li>
            ))}
          </ul>
        </Bolum>
      ) : null}

      {not.anahtarlar.length ? (
        <Bolum baslik="Anahtar Kavramlar">
          <div className="flex flex-wrap gap-1.5">
            {not.anahtarlar.map(({ kelime, sayi }) => (
              <Etiket key={kelime} renk="indigo">
                {kelime} · {sayi}
              </Etiket>
            ))}
          </div>
        </Bolum>
      ) : null}
    </article>
  );
}
