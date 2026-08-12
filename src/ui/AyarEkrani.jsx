// Uygulama ayarları. Her şey tarayıcıda (localStorage) saklanır.

import { Alan, Kart, girdiSinifi } from './parcalar.jsx';
import { ekranKilidiVarMi } from '../core/ekran.js';

const DILLER = [
  { id: 'tr-TR', ad: 'Türkçe (Türkiye)' },
  { id: 'en-US', ad: 'İngilizce (ABD)' },
  { id: 'de-DE', ad: 'Almanca' },
];

function Anahtar({ etiket, aciklama, isaretli, degistir }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={isaretli}
        onChange={(olay) => degistir(olay.target.checked)}
        className="mt-0.5 size-4 accent-indigo-600"
      />
      <span>
        <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100">
          {etiket}
        </span>
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{aciklama}</span>
      </span>
    </label>
  );
}

export default function AyarEkrani({ ayarlar, guncelle }) {
  const ayarla = (alan) => (deger) => guncelle({ ...ayarlar, [alan]: deger });

  return (
    <div className="space-y-4">
      <Kart className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Dinleme
        </h3>

        <Alan
          etiket="Konuşma dili"
          aciklama="Türkçe cümle sezgileri yalnızca tr-TR seçiliyken tam çalışır."
        >
          <select
            value={ayarlar.dil}
            onChange={(olay) => ayarla('dil')(olay.target.value)}
            className={girdiSinifi}
          >
            {DILLER.map((dil) => (
              <option key={dil.id} value={dil.id}>
                {dil.ad}
              </option>
            ))}
          </select>
        </Alan>

        <Anahtar
          etiket="Ekranı açık tut"
          aciklama={
            ekranKilidiVarMi()
              ? 'Ders boyunca telefon ekranı kapanmaz.'
              : 'Bu tarayıcı ekran kilidini desteklemiyor.'
          }
          isaretli={ayarlar.ekraniAcikTut}
          degistir={ayarla('ekraniAcikTut')}
        />

        <Anahtar
          etiket="Dolgu sözcüklerini temizle"
          aciklama="“eee”, “yani”, “arkadaşlar”, “tamam mı” gibi ifadeler nota girmez."
          isaretli={ayarlar.dolguTemizle}
          degistir={ayarla('dolguTemizle')}
        />
      </Kart>

      <Kart className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Ses dosyasını yazıya çevirme
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Canlı dinleme yalnızca Chrome ve Edge’de çalışır. iPhone’da veya kaydedilmiş
          dersler için OpenAI uyumlu bir servis kullanılır. Anahtar yalnızca bu cihazda
          saklanır; ses dosyası doğrudan tarayıcıdan servise gider.
        </p>

        <Alan etiket="API anahtarı" aciklama="Boş bırakırsanız ses dosyası yükleme kapalı kalır.">
          <input
            type="password"
            value={ayarlar.cevirimAnahtari}
            onChange={(olay) => ayarla('cevirimAnahtari')(olay.target.value)}
            placeholder="sk-…"
            autoComplete="off"
            className={girdiSinifi}
          />
        </Alan>

        <Alan etiket="Model">
          <input
            type="text"
            value={ayarlar.cevirimModel}
            onChange={(olay) => ayarla('cevirimModel')(olay.target.value)}
            className={girdiSinifi}
          />
        </Alan>

        <Alan etiket="Servis adresi" aciklama="OpenAI uyumlu başka bir sunucu da kullanabilirsiniz.">
          <input
            type="url"
            value={ayarlar.cevirimUrl}
            onChange={(olay) => ayarla('cevirimUrl')(olay.target.value)}
            className={girdiSinifi}
          />
        </Alan>
      </Kart>

      <Kart className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Gizlilik</h3>
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Not çıkarma tamamen cihazınızda, kural tabanlı olarak çalışır — metin hiçbir
          sunucuya gönderilmez. Canlı dinlemede sesi tarayıcının kendi konuşma tanıma
          servisi işler. Kaydettiğiniz dersler tarayıcının yerel veritabanında (IndexedDB)
          durur; tarayıcı verilerini silerseniz kayıtlar da silinir.
        </p>
      </Kart>
    </div>
  );
}
