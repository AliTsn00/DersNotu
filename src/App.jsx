import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import { notCikar } from './turkce/index.js';
import { duzenlemeyeAl, yeniMaddeleriKat } from './turkce/duzenle.js';
import { Dinleyici, konusmaTanimaVarMi, kesiniKat } from './core/dinleme.js';
import { sesiYaziyaCevir, CEVIRIM_SERVISLERI } from './core/kayitci.js';
import { akilliNotCikar } from './core/zeka.js';
import { ekraniAcikTut, ekranKilidiniBirak, ekranKilidiniIzle } from './core/ekran.js';
import {
  VARSAYILAN_AYARLAR,
  ayarlariOku,
  ayarlariYaz,
  dersKaydet,
  dersSil,
  dersleriGetir,
  yeniKimlik,
  taslakOku,
  taslakYaz,
  taslakSil,
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
  // Kurtarılan taslağın zaman damgası; 0 ise kurtarma olmadı.
  const [kurtarilan, kurtarilanAyarla] = useState(0);
  // Yapay zekâ ile not çıkarma durumu.
  const [zekaCalisiyor, zekaCalisiyorAyarla] = useState(false);
  const [zekaIlerleme, zekaIlerlemeAyarla] = useState(null);
  const [zekaHatasi, zekaHatasiAyarla] = useState('');
  const [zekaUyarilari, zekaUyarilariAyarla] = useState([]);
  // Yeni sürüm indiğinde, yenilemeyi uygulayacak işlevi tutar.
  const [yeniSurum, yeniSurumAyarla] = useState(null);

  const dinleyiciRef = useRef(null);
  const baslangicRef = useRef(0);
  // Süren yazıya çevirme isteğini iptal edebilmek için.
  const cevirimRef = useRef(null);
  const zekaRef = useRef(null);
  const canliDestekli = useMemo(() => konusmaTanimaVarMi(), []);
  // Çerçeve (iframe) içinde açıldığında tarayıcı mikrofon izni sormaz.
  const cerceveIcinde = useMemo(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
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

  // --- Kaydedilmemiş taslak ------------------------------------------------
  //
  // Ders sürerken sekme kapanabilir, telefon uygulamayı bellekten atabilir.
  // Kaydet düğmesine basılmadıysa ham metin bugüne kadar kayboluyordu.

  // Açılışta yarım kalmış ders varsa geri yükle.
  useEffect(() => {
    const taslak = taslakOku();
    if (!taslak) return;
    hamMetinAyarla(taslak.hamMetin);
    if (taslak.elleNot) elleNotAyarla(taslak.elleNot);
    if (taslak.aktifId) aktifIdAyarla(taslak.aktifId);
    if (taslak.sure) sureAyarla(taslak.sure);
    kurtarilanAyarla(taslak.zaman || 0);
  }, []);

  // Olay dinleyicileri eski closure'a takılmasın diye güncel hâl ref'te durur.
  const taslakRef = useRef(null);
  useEffect(() => {
    taslakRef.current = { hamMetin, elleNot, aktifId, sure };
  });

  // Sayfa kapanırken gecikmeli yazmayı bekleyemeyiz; anında yaz.
  useEffect(() => {
    const yaz = () => taslakYaz(taslakRef.current);
    window.addEventListener('pagehide', yaz);
    return () => window.removeEventListener('pagehide', yaz);
  }, []);

  // main.jsx yeni sürüm indiğinde haber verir.
  useEffect(() => {
    const dinle = (olay) => yeniSurumAyarla(() => olay.detail);
    window.addEventListener('yeni-surum', dinle);
    return () => window.removeEventListener('yeni-surum', dinle);
  }, []);

  // Metin değiştikçe gecikmeli yaz: canlı dinlemede metin saniyede birkaç kez
  // değişiyor, her değişimde depolamaya yazmak gereksiz.
  useEffect(() => {
    const zamanlayici = setTimeout(() => taslakYaz(taslakRef.current), 1500);
    return () => clearTimeout(zamanlayici);
  }, [hamMetin, elleNot, aktifId]);

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

  const dinlemeyiBaslat = useCallback(() => {
    hataAyarla('');
    const dinleyici = new Dinleyici({
      dil: ayarlar.dil,
      onAra: araMetinAyarla,
      onKesin: (metin, degistir) => {
        hamMetinAyarla((onceki) => kesiniKat(onceki, metin, degistir));
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

    if (!dinleyici.baslat()) return;
    dinleyiciRef.current = dinleyici;
    if (!baslangicRef.current || !hamMetin) baslangicRef.current = Date.now() - sure * 1000;
    dinliyorAyarla(true);
  }, [ayarlar.dil, hamMetin, sure]);

  const baslatDurdur = useCallback(() => {
    if (dinliyor) {
      dinlemeyiDurdur();
      sekmeAyarla('not');
    } else {
      dinlemeyiBaslat();
    }
  }, [dinliyor, dinlemeyiBaslat, dinlemeyiDurdur]);

  // --- Ses dosyası ---------------------------------------------------------
  const cevirimiIptalEt = useCallback(() => {
    cevirimRef.current?.abort();
  }, []);

  const dosyaSec = useCallback(
    async (dosya) => {
      hataAyarla('');
      cevriliyorAyarla(true);
      const durdurucu = new AbortController();
      cevirimRef.current = durdurucu;
      try {
        const servis = Object.values(CEVIRIM_SERVISLERI).find(
          (s) => s.url === ayarlar.cevirimUrl,
        );
        const metin = await sesiYaziyaCevir(dosya, {
          anahtar: ayarlar.cevirimAnahtari,
          model: ayarlar.cevirimModel,
          temelUrl: ayarlar.cevirimUrl,
          dil: ayarlar.dil.slice(0, 2),
          enBuyukMB: servis?.enBuyukMB ?? 25,
          isaret: durdurucu.signal,
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
        cevirimRef.current = null;
      }
    },
    [ayarlar],
  );

  // --- Yapay zekâ ile not ---------------------------------------------------
  const zekaHazir = Boolean(ayarlar.zekaHesap && ayarlar.zekaAnahtari);

  const zekayiIptalEt = useCallback(() => {
    zekaRef.current?.abort();
  }, []);

  const akilliNotuCikar = useCallback(async () => {
    if (!hamMetin.trim() || zekaCalisiyor) return;
    zekaHatasiAyarla('');
    zekaUyarilariAyarla([]);
    zekaCalisiyorAyarla(true);
    const durdurucu = new AbortController();
    zekaRef.current = durdurucu;
    try {
      const { not: yeni, uyarilar } = await akilliNotCikar(hamMetin, {
        hesapKimligi: ayarlar.zekaHesap,
        anahtar: ayarlar.zekaAnahtari,
        model: ayarlar.zekaModel,
        detay: ayarlar.detay,
        sure,
        isaret: durdurucu.signal,
        ilerleme: zekaIlerlemeAyarla,
      });
      // Akıllı not, elle düzenleme yuvasına konur: kaydetme, düzenleme ve
      // arşivleme altyapısı böylece olduğu gibi çalışır.
      elleNotAyarla(yeni);
      zekaUyarilariAyarla(uyarilar);
      sekmeAyarla('not');
    } catch (sorun) {
      zekaHatasiAyarla(sorun.message || 'Akıllı not çıkarılamadı.');
    } finally {
      zekaCalisiyorAyarla(false);
      zekaIlerlemeAyarla(null);
      zekaRef.current = null;
    }
  }, [hamMetin, zekaCalisiyor, ayarlar, sure]);

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
    kurtarilanAyarla(0);
    zekaHatasiAyarla('');
    zekaUyarilariAyarla([]);
    taslakSil();
  }, [dinlemeyiDurdur]);

  const ornekYukle = useCallback((ornek) => {
    hamMetinAyarla(ornek.metin);
    sureAyarla(ornek.sure || 0);
    aktifIdAyarla(null);
    elleNotAyarla(null);
    duzenleniyorAyarla(false);
    kurtarilanAyarla(0);
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
    // Ders arşive girdi; taslak artık kaybolabilecek bir şey değil.
    kurtarilanAyarla(0);
    taslakSil();
  }, [not, elleNot, aktifId, sure, hamMetin, ayarlar.detay, arsiviTazele]);

  const arsivAc = useCallback(
    (ders) => {
      dinlemeyiDurdur();
      hamMetinAyarla(ders.hamMetin);
      sureAyarla(ders.sure || 0);
      aktifIdAyarla(ders.id);
      elleNotAyarla(ders.elleNot || null);
      duzenleniyorAyarla(false);
      kurtarilanAyarla(0);
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
    zekaUyarilariAyarla([]);
    zekaHatasiAyarla('');
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
        {yeniSurum ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-900 dark:bg-indigo-950/40">
            <p className="text-sm text-indigo-900 dark:text-indigo-200">
              Uygulamanın yeni sürümü hazır.
            </p>
            <button
              type="button"
              onClick={() => yeniSurum()}
              className="shrink-0 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Yenile
            </button>
          </div>
        ) : null}

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
            cevirimiIptalEt={cevirimiIptalEt}
            kurtarilan={kurtarilan}
            kurtarilaniKapat={() => kurtarilanAyarla(0)}
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
            akilliNotuCikar={akilliNotuCikar}
            zekayiIptalEt={zekayiIptalEt}
            zekaHazir={zekaHazir}
            zekaCalisiyor={zekaCalisiyor}
            zekaIlerleme={zekaIlerleme}
            zekaHatasi={zekaHatasi}
            zekaUyarilari={zekaUyarilari}
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
