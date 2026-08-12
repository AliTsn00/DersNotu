// Not nesnesini ekranda gösterir (salt okunur görünüm).

import { tarihYaz, sureYaz, TUR_ETIKETLERI } from '../turkce/bicim.js';
import {
  arapcaMi,
  DOGRULAMA_UYARISI,
  dogrulamaUyarisiGerekliMi,
} from '../turkce/islami.js';
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

const ALINTI_RENKLERI = {
  ayet: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
  hadis: 'border-sky-500 bg-sky-50 dark:bg-sky-950/40',
  dua: 'border-violet-500 bg-violet-50 dark:bg-violet-950/40',
  arapca: 'border-zinc-400 bg-zinc-50 dark:bg-zinc-800/60',
};

const ALINTI_YAZI = {
  ayet: 'text-emerald-800 dark:text-emerald-300',
  hadis: 'text-sky-800 dark:text-sky-300',
  dua: 'text-violet-800 dark:text-violet-300',
  arapca: 'text-zinc-600 dark:text-zinc-300',
};

/** Âyet / hadîs / duâ / Arapça ibare kutusu. */
export function AlintiKutusu({ madde, numara }) {
  const etiket = TUR_ETIKETLERI[madde.tur];
  const arapca = arapcaMi(madde.metin);

  return (
    <div className={`rounded-xl border-l-4 px-3 py-2 ${ALINTI_RENKLERI[madde.tur]}`}>
      <p className={`flex flex-wrap items-center gap-1.5 text-xs font-semibold ${ALINTI_YAZI[madde.tur]}`}>
        {numara ? <span className="text-zinc-400">{numara}</span> : null}
        <span>
          {etiket.simge} {etiket.ad}
        </span>
        {madde.kaynakKunyesi ? <span>· {madde.kaynakKunyesi}</span> : null}
        {madde.dogrulanmadi ? <Etiket renk="amber">doğrulanmadı</Etiket> : null}
      </p>
      <p
        dir={arapca ? 'rtl' : 'ltr'}
        lang={arapca ? 'ar' : 'tr'}
        className={
          arapca
            ? 'arapca mt-1 text-right text-[22px] leading-[2] text-zinc-900 dark:text-zinc-50'
            : 'mt-0.5 text-[15px] italic leading-relaxed text-zinc-800 dark:text-zinc-200'
        }
      >
        {madde.metin}
      </p>
    </div>
  );
}

function Madde({ madde }) {
  const alinti = ALINTI_RENKLERI[madde.tur];
  const onemli = madde.tur === 'onemli';
  const gorus = madde.tur === 'gorus';
  const listeMi = madde.tur === 'listeBasi';

  return (
    <li className="space-y-1.5">
      {alinti ? (
        <AlintiKutusu madde={madde} numara={madde.numara} />
      ) : (
        <div
          className={
            onemli
              ? 'rounded-xl border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-[15px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
              : 'text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200'
          }
        >
          <span className="mr-1.5 text-xs font-semibold text-zinc-400 tabular-nums">
            {madde.numara}
          </span>
          {onemli ? <span className="mr-1 font-semibold">Önemli:</span> : null}
          {gorus ? <span className="mr-1 font-semibold">⚖️ Görüş:</span> : null}
          {kalinlariCoz(madde.metin)}
        </div>
      )}

      {madde.alt?.length ? (
        <ul className="ml-4 space-y-1.5 border-l border-zinc-200 pl-4 dark:border-zinc-700">
          {madde.alt.map((alt) =>
            ALINTI_RENKLERI[alt.tur] ? (
              <li key={alt.id}>
                <AlintiKutusu madde={alt} numara={alt.numara} />
              </li>
            ) : (
              <li
                key={alt.id}
                className={`text-sm leading-relaxed ${
                  alt.tur === 'ornek'
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : alt.tur === 'meal'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <span className="mr-1.5 text-xs font-semibold text-zinc-400 tabular-nums">
                  {listeMi && alt.tur === 'madde' ? alt.numara : alt.numara}
                </span>
                {kalinlariCoz(alt.metin)}
              </li>
            ),
          )}
        </ul>
      ) : null}
    </li>
  );
}

function Bolum({ baslik, numara, children }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-baseline gap-2 border-b border-zinc-200 pb-1.5 text-base font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
        {numara ? <span className="text-zinc-400">{numara}.</span> : null}
        {baslik}
      </h3>
      {children}
    </section>
  );
}

function AlintiDizini({ baslik, kayitlar }) {
  if (!kayitlar?.length) return null;
  return (
    <Bolum baslik={baslik}>
      <ul className="space-y-2">
        {kayitlar.map((kayit, sira) => (
          <li key={kayit.id || sira} className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
            {kayit.kunye ? (
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {kayit.kunye}
              </p>
            ) : null}
            <p
              dir={arapcaMi(kayit.metin) ? 'rtl' : 'ltr'}
              className={
                arapcaMi(kayit.metin)
                  ? 'arapca text-right text-lg leading-loose'
                  : 'text-sm italic text-zinc-700 dark:text-zinc-200'
              }
            >
              {kayit.metin}
            </p>
            {kayit.meal ? (
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">
                Meâli: {kayit.meal}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </Bolum>
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
        <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          {ustBilgi.join(' · ')}
          {not.elleDuzenlendi ? <Etiket renk="indigo">elle düzenlendi</Etiket> : null}
        </p>
      </header>

      {dogrulamaUyarisiGerekliMi(not) ? (
        <p className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          ⚠️ {DOGRULAMA_UYARISI}
        </p>
      ) : null}

      {not.bolumler.length > 1 ? (
        <nav className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            İçindekiler
          </p>
          <ol className="space-y-0.5 text-sm text-zinc-700 dark:text-zinc-300">
            {not.bolumler.map((bolum) => (
              <li key={bolum.id}>
                {bolum.numara}. {bolum.baslik}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      {not.bolumler.map((bolum) => (
        <Bolum key={bolum.id} baslik={bolum.baslik} numara={bolum.numara}>
          {bolum.gruplar.map((grup) => (
            <div key={grup.id} className="space-y-2.5">
              {grup.baslik ? (
                <h4 className="pt-1 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {grup.baslik}
                </h4>
              ) : null}
              <ul className="space-y-2.5">
                {grup.maddeler.map((madde) => (
                  <Madde key={madde.id} madde={madde} />
                ))}
              </ul>
            </div>
          ))}
        </Bolum>
      ))}

      {not.tanimlar.length ? (
        <Bolum baslik="Tanımlar">
          <dl className="space-y-2">
            {not.tanimlar.map(({ terim, aciklama }, sira) => (
              <div key={sira} className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {terim}
                </dt>
                <dd className="text-sm text-zinc-600 dark:text-zinc-300">{aciklama}</dd>
              </div>
            ))}
          </dl>
        </Bolum>
      ) : null}

      <AlintiDizini baslik="Geçen Âyetler" kayitlar={not.ayetler} />
      <AlintiDizini baslik="Geçen Hadîsler" kayitlar={not.hadisler} />
      <AlintiDizini baslik="Duâlar" kayitlar={not.dualar} />

      {not.gorusler?.length ? (
        <Bolum baslik="Görüşler ve İhtilaflar">
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-zinc-700 marker:text-zinc-400 dark:text-zinc-300">
            {not.gorusler.map((metin, sira) => (
              <li key={sira}>{metin}</li>
            ))}
          </ul>
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
              <li key={sira} className="flex gap-2 text-[15px] text-zinc-700 dark:text-zinc-300">
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
