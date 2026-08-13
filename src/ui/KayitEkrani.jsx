// Ders yakalama ekranı: canlı dinleme, ses dosyası veya metin yapıştırma.

import { useEffect, useRef, useState } from 'react';

import { sureYaz } from '../turkce/bicim.js';
import { ORNEK_DERSLER } from '../ornek.js';
import { seviyeOlcerBaslat, seviyeYorumu } from '../core/seviye.js';
import { Dugme, Kart, BosDurum, girdiSinifi } from './parcalar.jsx';

const MODLAR = [
  { id: 'canli', ad: 'Canlı dinle', aciklama: 'Ders anlatılırken mikrofondan yaz' },
  { id: 'dosya', ad: 'Ses dosyası', aciklama: 'Kaydedilmiş dersi yükle' },
  { id: 'metin', ad: 'Metin', aciklama: 'Hazır yazıyı yapıştır' },
];

const DURUM_METINLERI = {
  durdu: 'Hazır',
  dinliyor: 'Dinleniyor',
  'yeniden-baglanıyor': 'Yeniden bağlanıyor',
};

const TEST_SURESI_MS = 6000;

const SEVIYE_RENKLERI = {
  yok: 'bg-rose-500',
  zayif: 'bg-amber-500',
  iyi: 'bg-emerald-500',
  yuksek: 'bg-amber-500',
};

/**
 * Kayıt öncesi mikrofon denemesi.
 *
 * Tanıma kalitesini en çok belirleyen şey mikrofonun hocaya uzaklığı; bunu
 * dersten sonra notu okuyarak anlamak çok geç oluyor. Altı saniyelik ölçüm,
 * telefonun yerini değiştirmek için yeterli bilgi veriyor.
 */
function MikrofonTesti() {
  const [olculuyor, olculuyorAyarla] = useState(false);
  const [seviye, seviyeAyarla] = useState(0);
  const [tepe, tepeAyarla] = useState(0);
  const [bitti, bittiAyarla] = useState(false);
  const durdurRef = useRef(null);

  // Ekrandan çıkılırsa mikrofon açık kalmasın.
  useEffect(() => () => durdurRef.current?.(), []);

  const basla = async () => {
    if (olculuyor) return;
    olculuyorAyarla(true);
    bittiAyarla(false);
    tepeAyarla(0);
    seviyeAyarla(0);

    let enYuksek = 0;
    const durdur = await seviyeOlcerBaslat((deger) => {
      seviyeAyarla(deger);
      if (deger > enYuksek) enYuksek = deger;
    });
    durdurRef.current = durdur;

    setTimeout(() => {
      durdur();
      durdurRef.current = null;
      olculuyorAyarla(false);
      seviyeAyarla(0);
      tepeAyarla(enYuksek);
      bittiAyarla(true);
    }, TEST_SURESI_MS);
  };

  const yorum = bitti ? seviyeYorumu(tepe) : null;

  return (
    <div className="w-full max-w-md space-y-2 px-4 text-center">
      {olculuyor ? (
        <>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width] duration-100"
              style={{ width: `${Math.round(seviye * 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hoca gibi konuşun ya da bekleyin — ölçülüyor…
          </p>
        </>
      ) : (
        <button
          type="button"
          onClick={basla}
          className="text-xs text-zinc-500 underline decoration-dotted underline-offset-2 dark:text-zinc-400"
        >
          Mikrofonu test et
        </button>
      )}

      {yorum && !olculuyor ? (
        <p className="flex items-center justify-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <span className={`inline-block size-2 rounded-full ${SEVIYE_RENKLERI[yorum.durum]}`} />
          {yorum.mesaj}
        </p>
      ) : null}
    </div>
  );
}

function KayitDugmesi({ dinliyor, onTikla, kapali }) {
  return (
    <button
      type="button"
      onClick={onTikla}
      disabled={kapali}
      aria-label={dinliyor ? 'Dinlemeyi durdur' : 'Dinlemeye başla'}
      className={`relative flex size-28 items-center justify-center rounded-full
        text-white transition-transform active:scale-95 disabled:opacity-40
        ${dinliyor ? 'bg-red-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}
    >
      {dinliyor ? (
        <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
      ) : null}
      <svg viewBox="0 0 24 24" fill="none" className="relative size-11" aria-hidden="true">
        {dinliyor ? (
          <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
        ) : (
          <>
            <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
            <path
              d="M5 11a7 7 0 0 0 14 0M12 18v3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </button>
  );
}

export default function KayitEkrani({
  mod,
  modDegistir,
  dinliyor,
  durum,
  sure,
  araMetin,
  hamMetin,
  hamMetinDegistir,
  baslatDurdur,
  dosyaSec,
  cevriliyor,
  cevirimiIptalEt,
  hata,
  kurtarilan,
  kurtarilaniKapat,
  canliDestekli,
  cerceveIcinde,
  ornekYukle,
  temizle,
}) {
  const cumleSayisi = hamMetin.split('\n').filter(Boolean).length;
  const kelimeSayisi = hamMetin.split(/\s+/).filter(Boolean).length;
  const kurtarilanZaman = kurtarilan
    ? new Date(kurtarilan).toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Kaynak seçimi"
        className="grid grid-cols-3 gap-1 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800"
      >
        {MODLAR.map((secenek) => (
          <button
            key={secenek.id}
            type="button"
            role="tab"
            aria-selected={mod === secenek.id}
            onClick={() => modDegistir(secenek.id)}
            className={`rounded-xl px-2 py-2 text-sm font-medium transition-colors ${
              mod === secenek.id
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {secenek.ad}
          </button>
        ))}
      </div>

      {hata ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {hata}
        </p>
      ) : null}

      {kurtarilan ? (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <p>
            Kaydedilmemiş bir ders bulundu ve geri yüklendi
            {kurtarilanZaman ? ` (${kurtarilanZaman})` : ''}. Arşive almak için{' '}
            <strong>Not</strong> sekmesinden <strong>Kaydet</strong>’e basın.
          </p>
          <button
            type="button"
            onClick={kurtarilaniKapat}
            aria-label="Bildirimi kapat"
            className="shrink-0 rounded-lg px-2 py-0.5 text-lg leading-none hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            ×
          </button>
        </div>
      ) : null}

      {mod === 'canli' ? (
        <Kart className="flex flex-col items-center gap-4 py-8">
          {!canliDestekli ? (
            <p className="mx-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              Bu tarayıcı canlı konuşma tanımayı desteklemiyor (iPhone/Safari dahil).
              Dersi <strong>Ses dosyası</strong> sekmesinden yükleyebilirsiniz.
            </p>
          ) : null}

          {canliDestekli && cerceveIcinde ? (
            <p className="mx-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              Sayfa bir çerçeve içinde açık; tarayıcı bu durumda mikrofon izni sormaz.
              Canlı dinleme için uygulamayı <strong>kendi sekmesinde</strong> açın.{' '}
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank', 'noopener')}
                className="min-h-0 underline underline-offset-2"
              >
                Yeni sekmede aç
              </button>
            </p>
          ) : null}

          <KayitDugmesi
            dinliyor={dinliyor}
            onTikla={baslatDurdur}
            kapali={!canliDestekli}
          />

          <div className="text-center">
            <p className="font-mono text-3xl tabular-nums text-zinc-900 dark:text-zinc-50">
              {sureYaz(sure)}
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <span
                className={`inline-block size-2 rounded-full ${
                  dinliyor ? 'animate-pulse bg-red-500' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
              />
              {DURUM_METINLERI[durum] || durum}
            </p>
          </div>

          <p className="min-h-12 max-w-xl px-4 text-center text-sm italic text-zinc-400">
            {araMetin || (dinliyor ? 'Hoca konuşmayı bekliyor…' : '')}
          </p>

          {!dinliyor && canliDestekli ? <MikrofonTesti /> : null}
        </Kart>
      ) : null}

      {mod === 'dosya' ? (
        <Kart className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Kaydedilmiş ders sesini yükleyin. Dosya, <strong>Ayarlar</strong> bölümünde
            tanımladığınız yazıya çevirme servisine gönderilir; anahtarınız yalnızca bu
            cihazda saklanır.
          </p>
          <input
            type="file"
            accept="audio/*,video/mp4,.m4a,.mp3,.wav,.webm,.ogg"
            onChange={(olay) => {
              const dosya = olay.target.files?.[0];
              if (dosya) dosyaSec(dosya);
              olay.target.value = '';
            }}
            disabled={cevriliyor}
            className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-xl
              file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm
              file:font-medium file:text-white hover:file:bg-indigo-500
              dark:text-zinc-300"
          />
          {cevriliyor ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-indigo-600 dark:text-indigo-400">
                Ses yazıya çevriliyor… Uzun dersler birkaç dakika sürebilir.
              </p>
              <button
                type="button"
                onClick={cevirimiIptalEt}
                className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs
                  font-medium text-zinc-700 hover:border-zinc-400
                  dark:border-zinc-600 dark:text-zinc-200"
              >
                İptal
              </button>
            </div>
          ) : null}
        </Kart>
      ) : null}

      {mod === 'metin' ? (
        <Kart className="space-y-3">
          <textarea
            value={hamMetin}
            onChange={(olay) => hamMetinDegistir(olay.target.value)}
            rows={12}
            placeholder="Ders metnini buraya yapıştırın…"
            className={`${girdiSinifi} resize-y font-mono text-[13px] leading-relaxed`}
          />
          <div className="flex flex-wrap gap-1.5">
            {ORNEK_DERSLER.map((ornek) => (
              <Dugme
                key={ornek.id}
                cesit="sade"
                boyut="kucuk"
                onClick={() => ornekYukle(ornek)}
              >
                {ornek.ad}
              </Dugme>
            ))}
          </div>
        </Kart>
      ) : null}

      <Kart className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Ham çözümleme
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {cumleSayisi} parça · {kelimeSayisi} kelime
            </span>
            {hamMetin ? (
              <Dugme cesit="tehlike" boyut="kucuk" onClick={temizle}>
                Sıfırla
              </Dugme>
            ) : null}
          </div>
        </div>

        {hamMetin ? (
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-zinc-50 p-3 text-[13px] leading-relaxed text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
            {hamMetin}
          </pre>
        ) : (
          <BosDurum
            baslik="Henüz kayıt yok"
            aciklama="Dinlemeye başlayın; hocanın söyledikleri buraya düşecek, not sekmesinde maddelenecek."
          />
        )}
      </Kart>
    </div>
  );
}
