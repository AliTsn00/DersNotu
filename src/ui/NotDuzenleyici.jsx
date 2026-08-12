// Notu elle düzenleme görünümü: metin değiştirme, tür değiştirme,
// sıralama, seviye değiştirme, ekleme ve silme.

import {
  DUZENLENEBILIR_TURLER,
  baslikDegistir,
  bolumBasligiDegistir,
  bolumEkle,
  bolumSil,
  grupBasligiDegistir,
  listeGuncelle,
  maddeEkle,
  maddeMetniDegistir,
  maddeSeviyeDegistir,
  maddeSil,
  maddeTasi,
  maddeTuruDegistir,
} from '../turkce/duzenle.js';
import { arapcaMi } from '../turkce/islami.js';
import { Dugme, Kart, girdiSinifi } from './parcalar.jsx';

function AraDugme({ baslik, onClick, children, kapali }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={kapali}
      title={baslik}
      aria-label={baslik}
      className="flex size-8 min-h-0 items-center justify-center rounded-lg text-zinc-500
        transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30
        dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {children}
    </button>
  );
}

function MaddeDuzenle({ madde, uygula, altMi = false }) {
  const arapca = arapcaMi(madde.metin);

  return (
    <li className={altMi ? 'ml-4 border-l border-zinc-200 pl-3 dark:border-zinc-700' : ''}>
      <div className="rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
        <div className="mb-1.5 flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs font-semibold text-zinc-400 tabular-nums">
            {madde.numara}
          </span>

          <select
            value={madde.tur}
            onChange={(olay) => uygula((not) => maddeTuruDegistir(not, madde.id, olay.target.value))}
            aria-label="Madde türü"
            className="min-h-0 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs
              text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            {DUZENLENEBILIR_TURLER.map((tur) => (
              <option key={tur.id} value={tur.id}>
                {tur.ad}
              </option>
            ))}
          </select>

          <div className="ml-auto flex items-center">
            <AraDugme baslik="Yukarı taşı" onClick={() => uygula((not) => maddeTasi(not, madde.id, 'yukari'))}>
              ↑
            </AraDugme>
            <AraDugme baslik="Aşağı taşı" onClick={() => uygula((not) => maddeTasi(not, madde.id, 'asagi'))}>
              ↓
            </AraDugme>
            <AraDugme
              baslik={altMi ? 'Üst seviyeye çıkar' : 'Bir öncekinin altına al'}
              onClick={() =>
                uygula((not) => maddeSeviyeDegistir(not, madde.id, altMi ? 'cikar' : 'indir'))
              }
            >
              {altMi ? '←' : '→'}
            </AraDugme>
            <AraDugme baslik="Altına yeni madde ekle" onClick={() => uygula((not) => maddeEkle(not, madde.id))}>
              +
            </AraDugme>
            <AraDugme baslik="Maddeyi sil" onClick={() => uygula((not) => maddeSil(not, madde.id))}>
              ✕
            </AraDugme>
          </div>
        </div>

        <textarea
          value={madde.metin}
          onChange={(olay) => uygula((not) => maddeMetniDegistir(not, madde.id, olay.target.value))}
          rows={Math.min(8, Math.max(2, Math.ceil(madde.metin.length / 42)))}
          dir={arapca ? 'rtl' : 'ltr'}
          placeholder="Madde metni…"
          className={`${girdiSinifi} min-h-0 resize-y py-1.5 text-sm ${arapca ? 'arapca text-lg leading-loose' : ''}`}
        />
      </div>

      {madde.alt?.length ? (
        <ul className="mt-1.5 space-y-1.5">
          {madde.alt.map((alt) => (
            <MaddeDuzenle key={alt.id} madde={alt} uygula={uygula} altMi />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ListeDuzenle({ etiket, alan, degerler, uygula }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{etiket}</span>
      <textarea
        value={degerler.join('\n')}
        onChange={(olay) =>
          uygula((not) => listeGuncelle(not, alan, olay.target.value.split('\n')))
        }
        rows={Math.max(2, degerler.length + 1)}
        placeholder="Her satıra bir madde"
        className={`${girdiSinifi} resize-y text-sm`}
      />
      <span className="text-xs text-zinc-500 dark:text-zinc-400">Her satır bir maddedir.</span>
    </label>
  );
}

export default function NotDuzenleyici({ not, degistir }) {
  const uygula = (islem) => degistir(islem(not));

  return (
    <div className="space-y-4">
      <Kart className="space-y-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
            Not başlığı
          </span>
          <input
            value={not.baslik}
            onChange={(olay) => uygula((n) => baslikDegistir(n, olay.target.value))}
            className={`${girdiSinifi} text-base font-semibold`}
          />
        </label>
      </Kart>

      {not.bolumler.map((bolum) => (
        <Kart key={bolum.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-400">{bolum.numara}.</span>
            <input
              value={bolum.baslik}
              onChange={(olay) =>
                uygula((n) => bolumBasligiDegistir(n, bolum.id, olay.target.value))
              }
              aria-label="Bölüm başlığı"
              className={`${girdiSinifi} font-semibold`}
            />
            <Dugme
              cesit="tehlike"
              boyut="kucuk"
              onClick={() => uygula((n) => bolumSil(n, bolum.id))}
            >
              Bölümü sil
            </Dugme>
          </div>

          {bolum.gruplar.map((grup) => (
            <div key={grup.id} className="space-y-2">
              <input
                value={grup.baslik || ''}
                onChange={(olay) =>
                  uygula((n) => grupBasligiDegistir(n, grup.id, olay.target.value))
                }
                placeholder="Alt başlık (boş bırakılabilir)"
                aria-label="Alt başlık"
                className={`${girdiSinifi} text-sm uppercase tracking-wide`}
              />
              <ul className="space-y-2">
                {grup.maddeler.map((madde) => (
                  <MaddeDuzenle key={madde.id} madde={madde} uygula={uygula} />
                ))}
              </ul>
            </div>
          ))}
        </Kart>
      ))}

      <Dugme cesit="sade" onClick={() => uygula((n) => bolumEkle(n))}>
        + Bölüm ekle
      </Dugme>

      <Kart className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Ek bölümler
        </h3>
        <ListeDuzenle etiket="Özet" alan="ozet" degerler={not.ozet} uygula={uygula} />
        <ListeDuzenle
          etiket="Cevaplanacak sorular"
          alan="sorular"
          degerler={not.sorular}
          uygula={uygula}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Tanımlar, âyetler, hadîsler, görüşler ve “sınavda çıkabilir” listeleri
          maddelerden türetilir; ilgili maddeyi düzenlediğinizde kendiliğinden güncellenir.
        </p>
      </Kart>
    </div>
  );
}
