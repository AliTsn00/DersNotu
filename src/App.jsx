import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import { notCikar } from './turkce/index.js';
import { duzenlemeyeAl, yeniMaddeleriKat } from './turkce/duzenle.js';
import { dinleyiciOlustur, canliDinlemeVarMi, cerceveIcindeMi } from './core/platform.js';
import { sesiYaziyaCevir } from './core/kayitci.js';
import { ekraniAcikTut, ekranKilidiniBirak, ekranKilidiniIzle } from './core/ekran.js';
import {
  VARSAYILAN_AYARLAR,
  ayarlariOku,
  ayarlariYaz,
  dersKaydet,
  dersSil,
  dersleriGetir,
  yeniKimlik,
} from './core/depo.js';

import KayitEkrani from './ui/KayitEkrani.jsx';
import NotEkrani from './ui/NotEkrani.jsx';
import ArsivEkrani from './ui/ArsivEkrani.jsx';
import AyarEkrani from './ui/AyarEkrani.jsx';

const SEKMELER = [
  { id: 'kayit', ad: 'Kayıt' },
  { id: 'not', ad: 'Not' },
  { id: 'arsiv', ad: 'Arşiv' },
  { id: 'ayarlar', ad: 'Ayarlar' },
];

export default function App() {
  const [ayarlar, ayarlariAyarla] = useState(() =>
    typeof window === 'undefined' ? VARSAYILAN_AYARLAR : ayarlariOku(),
  );
  const [sekme, sekmeAyarla] = useState('kayit');
  const [mod, modAyarla] = useState('canli');

  const [hamMetin, hamMetinAyarla] = useState('');
  const [araMetin, araMetinAyarla] = useState('');
  const [durum, durumAyarla] = useState('durdu');
  const [dinliyor, dinliyorAyarla] = useState(false);
  const [sure, sureAyarla] = useState(0);
  const [hata, hataAyarla] = useState('');
  const [cevriliyor, cevriliyorAyarla] = useState(false);
  const [dersler, derslerAyarla] = useState([]);
  const [aktifId, aktifIdAyarla] = useState(null);
  // Elle düzenlenmiş not; doluysa otomatik notun yerine o gösterilir.
  const [elleNot, elleNotAyarla] = useState(null);
  const [duzenleniyor, duzenleniyorAyarla] = useState(false);

  const dinleyiciRef = useRef(null);
  const baslangicRef = useRef(0);
  const [canliDestekli, canliDestekliAyarla] = useState(true);
  // Çerçeve (iframe) içinde açıldığında tarayıcı mikrofon izni sormaz.
  const cerceveIcinde = useMemo(() => cerceveIcindeMi(), []);

  useEffect(() => {
    canliDinlemeVarMi().then(canliDestekliAyarla);
  }, []);

  // Yakalanamayan hataları da kullanıcıya göster.
  useEffect(() => {
    const isle = (olay) => hataAyarla(`Beklenmeyen hata: ${olay.detail}`);
    document.addEventListener('uygulama-hatasi', isle);
    return () => document.removeEventListener('uygulama-hatasi', isle);
  }, []);

  // --- Not üretimi ---------------------------------------------------------
  // Konuşma sürerken her kelimede yeniden hesaplamamak için ertelenmiş değer.
  const ertelenmisMetin = useDeferredValue(hamMetin);
  const otomatikNot = useMemo(() => {
    if (!ertelenmisMetin.trim()) return null;
    return notCikar(ertelenmisMetin, {
      detay: ayarlar.detay,
      dolguTemizle: ayarlar.dolguTemizle,
      sure,
    });
  }, [ertelenmisMetin, ayarlar.detay, ayarlar.dolguTemizle, sure]);

  // Düzenlenmiş bir not varken ders sürüyorsa, yeni cümleler ona eklenir;
  // kullanıcının düzenlemeleri kaybolmaz.
  useEffect(() => {
    if (!elleNot || !otomatikNot) return;
    elleNotAyarla((onceki) => (onceki ? yeniMaddeleriKat(onceki, otomatikNot) : onceki));
  }, [otomatikNot, elleNot]);

  const not = elleNot || otomatikNot;

  // --- Ayar kalıcılığı -----------------------------------------------------
  const ayarGuncelle = useCallback((yeni) => {
    ayarlariAyarla(yeni);
    ayarlariYaz(yeni);
  }, []);

  // --- Arşiv ---------------------------------------------------------------
  const arsiviTazele = useCallback(() => {
    dersleriGetir()
      .then(derslerAyarla)
      .catch(() => derslerAyarla([]));
  }, []);

  useEffect(() => {
    arsiviTazele();
  }, [arsiviTazele]);

  // --- Süre sayacı ---------------------------------------------------------
  useEffect(() => {
    if (!dinliyor) return undefined;
    const zamanlayici = setInterval(() => {
      sureAyarla(Math.round((Date.now() - baslangicRef.current) / 1000));
    }, 1000);
    return () => clearInterval(zamanlayici);
  }, [dinliyor]);

  // --- Ekran kilidi --------------------------------------------------------
  useEffect(() => {
    if (dinliyor && ayarlar.ekraniAcikTut) {
      ekraniAcikTut();
      return ekranKilidiniIzle(() => true);
    }
    ekranKilidiniBirak();
    return undefined;
  }, [dinliyor, ayarlar.ekraniAcikTut]);

  // --- Dinleme -------------------------------------------------------------
  const dinlemeyiDurdur = useCallback(() => {
    dinleyiciRef.current?.durdur();
    dinleyiciRef.current = null;
    dinliyorAyarla(false);
    araMetinAyarla('');
  }, []);

  useEffect(() => dinlemeyiDurdur, [dinlemeyiDurdur]);

  const dinlemeyiKur = useCallback(async () => {
    // Uygulamada cihazın konuşma tanıma servisi, tarayıcıda Web Speech API.
    const dinleyici = await dinleyiciOlustur({
      dil: ayarlar.dil,
      onAra: araMetinAyarla,
      onKesin: (metin) => {
        hamMetinAyarla((onceki) => (onceki ? `${onceki}\n${metin}` : metin));
        araMetinAyarla('');
      },
      onDurum: (yeniDurum) => {
        durumAyarla(yeniDurum);
        // Mikrofon izni reddedilirse tanıma kendini kapatır; sayaç ve
        // "Kayıtta" göstergesi de durmalı.
        if (yeniDurum === 'durdu') {
          dinliyorAyarla(false);
          araMetinAyarla('');
        }
      },
      onHata: hataAyarla,
    });

    dinleyiciRef.current = dinleyici;
    if ((await dinleyici.baslat()) === false) {
      dinleyiciRef.current = null;
      return;
    }
    if (!baslangicRef.current || !hamMetin) baslangicRef.current = Date.now() - sure * 1000;
    dinliyorAyarla(true);
  }, [ayarlar.dil, hamMetin, sure]);

  const dinlemeyiBaslat = useCallback(async () => {
    hataAyarla('');
    try {
      await dinlemeyiKur();
    } catch (sorun) {
      // Sessiz başarısızlık olmasın: her hata ekranda görünsün.
      hataAyarla(`Dinleme başlatılamadı: ${sorun?.message || sorun}`);
      dinliyorAyarla(false);
    }
  }, [dinlemeyiKur]);

  const baslatDurdur = useCallback(() => {
    if (dinliyor) {
      dinlemeyiDurdur();
      sekmeAyarla('not');
    } else {
      dinlemeyiBaslat();
    }
  }, [dinliyor, dinlemeyiBaslat, dinlemeyiDurdur]);

  // --- Ses dosyası ---------------------------------------------------------
  const dosyaSec = useCallback(
    async (dosya) => {
      hataAyarla('');
      cevriliyorAyarla(true);
      try {
        const metin = await sesiYaziyaCevir(dosya, {
          anahtar: ayarlar.cevirimAnahtari,
          model: ayarlar.cevirimModel,
          temelUrl: ayarlar.cevirimUrl,
          dil: ayarlar.dil.slice(0, 2),
        });
        if (!metin) {
          hataAyarla('Serviste konuşma bulunamadı.');
          return;
        }
        // Cümle sonlarını satıra çevir: bölütleyici satırları sert sınır sayar.
        hamMetinAyarla((onceki) => {
          const yeni = metin.replace(/(?<=[.!?…])\s+/g, '\n');
          return onceki ? `${onceki}\n${yeni}` : yeni;
        });
        sekmeAyarla('not');
      } catch (sorun) {
        hataAyarla(sorun.message || 'Ses yazıya çevrilemedi.');
      } finally {
        cevriliyorAyarla(false);
      }
    },
    [ayarlar],
  );

  // --- Ders işlemleri ------------------------------------------------------
  const temizle = useCallback(() => {
    dinlemeyiDurdur();
    hamMetinAyarla('');
    araMetinAyarla('');
    sureAyarla(0);
    baslangicRef.current = 0;
    aktifIdAyarla(null);
    elleNotAyarla(null);
    duzenleniyorAyarla(false);
    hataAyarla('');
  }, [dinlemeyiDurdur]);

  const ornekYukle = useCallback((ornek) => {
    hamMetinAyarla(ornek.metin);
    sureAyarla(ornek.sure || 0);
    aktifIdAyarla(null);
    elleNotAyarla(null);
    duzenleniyorAyarla(false);
    sekmeAyarla('not');
  }, []);

  const kaydet = useCallback(async () => {
    if (!not) return;
    const id = aktifId || yeniKimlik();
    await dersKaydet({
      id,
      baslik: not.baslik,
      tarih: not.tarih,
      sure,
      hamMetin,
      detay: ayarlar.detay,
      maddeSayisi: not.istatistik.madde,
      // Elle düzenlenmiş not olduğu gibi saklanır; ham metinden yeniden
      // üretilirse kullanıcının değişiklikleri kaybolurdu.
      elleNot: elleNot || null,
    });
    aktifIdAyarla(id);
    arsiviTazele();
  }, [not, elleNot, aktifId, sure, hamMetin, ayarlar.detay, arsiviTazele]);

  const arsivAc = useCallback(
    (ders) => {
      dinlemeyiDurdur();
      hamMetinAyarla(ders.hamMetin);
      sureAyarla(ders.sure || 0);
      aktifIdAyarla(ders.id);
      elleNotAyarla(ders.elleNot || null);
      duzenleniyorAyarla(false);
      sekmeAyarla('not');
    },
    [dinlemeyiDurdur],
  );

  // --- Düzenleme -----------------------------------------------------------
  const duzenlemeyiAc = useCallback(() => {
    if (!elleNot && otomatikNot) elleNotAyarla(duzenlemeyeAl(otomatikNot));
    duzenleniyorAyarla(true);
    sekmeAyarla('not');
  }, [elleNot, otomatikNot]);

  const otomatigeDon = useCallback(() => {
    elleNotAyarla(null);
    duzenleniyorAyarla(false);
  }, []);

  const arsivSil = useCallback(
    async (id) => {
      await dersSil(id);
      if (aktifId === id) aktifIdAyarla(null);
      arsiviTazele();
    },
    [aktifId, arsiviTazele],
  );

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
              <path
                d="M5 11a7 7 0 0 0 14 0M12 18v3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-semibold leading-tight">Ders Notu</h1>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              Hocanın sesini maddeli nota çevirir
            </p>
          </div>
          {dinliyor ? (
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">
              <span className="size-2 animate-pulse rounded-full bg-red-500" />
              Kayıtta
            </span>
          ) : null}
        </div>

        <nav className="mx-auto max-w-3xl px-2 pb-1">
          <ul className="flex gap-1">
            {SEKMELER.map((secenek) => (
              <li key={secenek.id}>
                <button
                  type="button"
                  onClick={() => sekmeAyarla(secenek.id)}
                  aria-current={sekme === secenek.id ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    sekme === secenek.id
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  {secenek.ad}
                  {secenek.id === 'arsiv' && dersler.length ? (
                    <span className="ml-1 text-xs text-zinc-400">{dersler.length}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5 pb-16">
        {sekme === 'kayit' ? (
          <KayitEkrani
            mod={mod}
            modDegistir={modAyarla}
            dinliyor={dinliyor}
            durum={durum}
            sure={sure}
            araMetin={araMetin}
            hamMetin={hamMetin}
            hamMetinDegistir={hamMetinAyarla}
            baslatDurdur={baslatDurdur}
            dosyaSec={dosyaSec}
            cevriliyor={cevriliyor}
            hata={hata}
            canliDestekli={canliDestekli}
            cerceveIcinde={cerceveIcinde}
            ornekYukle={ornekYukle}
            temizle={temizle}
          />
        ) : null}

        {sekme === 'not' ? (
          <NotEkrani
            not={not}
            detay={ayarlar.detay}
            detayDegistir={(detay) => ayarGuncelle({ ...ayarlar, detay })}
            kaydet={kaydet}
            kayitliMi={Boolean(aktifId)}
            duzenleniyor={duzenleniyor}
            duzenlemeyiAc={duzenlemeyiAc}
            duzenlemeyiKapat={() => duzenleniyorAyarla(false)}
            otomatigeDon={otomatigeDon}
            notuDegistir={elleNotAyarla}
          />
        ) : null}

        {sekme === 'arsiv' ? (
          <ArsivEkrani dersler={dersler} ac={arsivAc} sil={arsivSil} />
        ) : null}

        {sekme === 'ayarlar' ? (
          <AyarEkrani ayarlar={ayarlar} guncelle={ayarGuncelle} />
        ) : null}
      </main>
    </div>
  );
}
