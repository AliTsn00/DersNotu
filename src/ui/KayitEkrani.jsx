// Ders yakalama ekranı: canlı dinleme, ses dosyası veya metin yapıştırma.

import { sureYaz } from '../turkce/bicim.js';
import { ORNEK_DERSLER } from '../ornek.js';
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
  hata,
  canliDestekli,
  cerceveIcinde,
  ornekYukle,
  temizle,
}) {
  const cumleSayisi = hamMetin.split('\n').filter(Boolean).length;
  const kelimeSayisi = hamMetin.split(/\s+/).filter(Boolean).length;

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
            <p className="text-sm text-indigo-600 dark:text-indigo-400">
              Ses yazıya çevriliyor, bu birkaç dakika sürebilir…
            </p>
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
