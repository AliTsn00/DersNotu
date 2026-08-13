// Üretilen notu gösteren, düzenleyen ve dışa aktaran ekran.

import { useState } from 'react';
import { markdownYaz, duzMetinYaz } from '../turkce/bicim.js';
import {
  markdownIndir,
  metinIndir,
  panoyaKopyala,
  pdfOlarakYazdir,
} from '../core/disaAktar.js';
import { wordIndir } from '../core/word.js';
import NotGovdesi from './NotGovdesi.jsx';
import NotDuzenleyici from './NotDuzenleyici.jsx';
import { Dugme, Kart, BosDurum } from './parcalar.jsx';

const DETAY_SECENEKLERI = [
  { id: 'kisa', ad: 'Kısa' },
  { id: 'orta', ad: 'Orta' },
  { id: 'detayli', ad: 'Detaylı' },
];

export default function NotEkrani({
  not,
  detay,
  detayDegistir,
  kaydet,
  kayitliMi,
  duzenleniyor,
  duzenlemeyiAc,
  duzenlemeyiKapat,
  otomatigeDon,
  notuDegistir,
  akilliNotuCikar,
  zekayiIptalEt,
  zekaHazir,
  zekaCalisiyor,
  zekaIlerleme,
  zekaHatasi,
  zekaUyarilari,
  mushafDuzeltmesi,
}) {
  const [bildirim, bildirimYaz] = useState('');
  const yapayZekaNotu = not?.uretim === 'yapayZeka';

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
      {/* Notun nasıl üretildiğini dürüstçe söyleyen şerit. Kural motoru
          cümleleri sınıflar ama anlamaz; bunu gizlemek yanlış beklenti kurar. */}
      {!yapayZekaNotu ? (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div>
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Bu, kural tabanlı ham taslak
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-300/90">
              Cümleler sınıflandırıldı ama <strong>anlaşılmadı</strong>. Yarım kalan
              cümleleri birleştirmek, konuşmayı yazı diline çevirmek ve konuya göre
              bölüm açmak için yapay zekâ gerekiyor.
            </p>
          </div>

          {zekaCalisiyor ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                Ders notu çıkarılıyor
                {zekaIlerleme ? ` — ${zekaIlerleme.adim}/${zekaIlerleme.toplam}. bölüm` : '…'}
              </p>
              <button
                type="button"
                onClick={zekayiIptalEt}
                className="shrink-0 rounded-lg border border-amber-400 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
              >
                İptal
              </button>
            </div>
          ) : (
            <Dugme cesit="ana" boyut="kucuk" onClick={akilliNotuCikar} disabled={!zekaHazir}>
              Akıllı not çıkar
            </Dugme>
          )}

          {!zekaHazir && !zekaCalisiyor ? (
            <p className="text-xs text-amber-800 dark:text-amber-300/90">
              Açmak için <strong>Ayarlar → Yapay zekâ ile not çıkarma</strong> bölümüne
              Cloudflare hesap kimliğinizi, anahtarınızı ve aracı adresini girin.
              Üçü de ücretsiz; kurulum depodaki <strong>ARACI-KURULUM.md</strong>{' '}
              dosyasında anlatılıyor.
            </p>
          ) : null}

          {zekaHatasi ? (
            <p className="whitespace-pre-line rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {zekaHatasi}
            </p>
          ) : null}
        </div>
      ) : null}

      {yapayZekaNotu && zekaUyarilari?.length ? (
        <div className="space-y-1 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
            Kontrol edilmesi gerekenler
          </p>
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-amber-800 dark:text-amber-300/90">
            {zekaUyarilari.map((uyari) => (
              <li key={uyari}>{uyari}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {mushafDuzeltmesi ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          <strong>{mushafDuzeltmesi} âyet</strong> mushaf metniyle düzeltildi. Konuşma
          tanımanın yazdığını görmek için alıntı kutusundaki bağlantıyı açın.
        </p>
      ) : null}

      <Kart className="flex flex-wrap items-center gap-2">
        {yapayZekaNotu ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              Yapay zekâ notu
            </span>
            <button
              type="button"
              onClick={otomatigeDon}
              className="min-h-0 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-100"
            >
              Ham taslağa dön
            </button>
          </div>
        ) : not.elleDuzenlendi ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              Elle düzenlendi
            </span>
            <button
              type="button"
              onClick={otomatigeDon}
              className="min-h-0 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-100"
            >
              Otomatiğe dön
            </button>
          </div>
        ) : (
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
                className={`min-h-0 rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors ${
                  detay === secenek.id
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
                }`}
              >
                {secenek.ad}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex flex-wrap gap-1.5">
          <Dugme
            cesit={duzenleniyor ? 'ana' : 'sade'}
            boyut="kucuk"
            onClick={duzenleniyor ? duzenlemeyiKapat : duzenlemeyiAc}
          >
            {duzenleniyor ? 'Düzenlemeyi bitir' : 'Düzenle'}
          </Dugme>
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
              try {
                await wordIndir(not);
              } catch {
                bildir('Word belgesi oluşturulamadı.');
              }
            }}
          >
            Word
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
              try {
                await kaydet();
                bildir('Ders arşive kaydedildi.');
              } catch {
                // Gizli sekme ya da depolama izni kapalıysa IndexedDB açılmaz.
                bildir('Kaydedilemedi: tarayıcı yerel depolamaya izin vermiyor.');
              }
            }}
          >
            {kayitliMi ? 'Güncelle' : 'Kaydet'}
          </Dugme>
        </div>

        {bildirim ? (
          <p role="status" className="w-full text-xs text-emerald-600 dark:text-emerald-400">
            {bildirim}
          </p>
        ) : null}
      </Kart>

      {duzenleniyor ? (
        <NotDuzenleyici not={not} degistir={notuDegistir} />
      ) : (
        <Kart className="p-5 sm:p-7">
          <NotGovdesi not={not} />
        </Kart>
      )}

      {!duzenleniyor && not.atlanan?.length ? (
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
