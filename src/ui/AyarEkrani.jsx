// Uygulama ayarları. Her şey tarayıcıda (localStorage) saklanır.

import { Alan, Kart, girdiSinifi } from './parcalar.jsx';
import { ekranKilidiVarMi } from '../core/ekran.js';
import { CEVIRIM_SERVISLERI } from '../core/kayitci.js';
import { ZEKA_MODELLERI } from '../core/zeka.js';

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

  /** Hazır servisi seçer: adres ve model birlikte değişmeli. */
  const servisSec = (anahtar) => {
    const servis = CEVIRIM_SERVISLERI[anahtar];
    guncelle({ ...ayarlar, cevirimUrl: servis.url, cevirimModel: servis.model });
  };

  const secili = Object.entries(CEVIRIM_SERVISLERI).find(
    ([, servis]) => servis.url === ayarlar.cevirimUrl,
  );
  const seciliServis = secili?.[1];

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
          Uzun dersler için önerilen yol budur: dersi telefonun kendi ses kaydedicisiyle
          kaydedin, sonra buradan yükleyin. Canlı dinleme 60 saniyede bir kesildiği için
          kelime kaybeder. Anahtar yalnızca bu cihazda saklanır; ses dosyası doğrudan
          tarayıcıdan servise gider.
        </p>

        <Alan etiket="Servis">
          <div className="flex flex-wrap gap-2">
            {Object.entries(CEVIRIM_SERVISLERI).map(([id, servis]) => (
              <button
                key={id}
                type="button"
                onClick={() => servisSec(id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  seciliServis === servis
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-200'
                }`}
              >
                {servis.ad}
              </button>
            ))}
          </div>
          {seciliServis && (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {seciliServis.aciklama} Anahtarı{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">
                {seciliServis.adres}
              </span>{' '}
              adresinden alırsınız. En büyük dosya: {seciliServis.enBuyukMB} MB
              {seciliServis.enBuyukMB === 25 && ' (90 dakikalık bir ders, orta kalitede kaydedilirse sığar)'}.
            </p>
          )}
        </Alan>

        <Alan etiket="API anahtarı" aciklama="Boş bırakırsanız ses dosyası yükleme kapalı kalır.">
          <input
            type="password"
            value={ayarlar.cevirimAnahtari}
            onChange={(olay) => ayarla('cevirimAnahtari')(olay.target.value)}
            placeholder={seciliServis === CEVIRIM_SERVISLERI.groq ? 'gsk_…' : 'sk-…'}
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

      <Kart className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Yapay zekâ ile not çıkarma
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Uygulamanın kendi not çıkarma motoru kural tabanlıdır: cümleleri sınıflar ama
          <strong> anlamaz</strong>. Yarım kalmış cümleleri birleştirmek, konuşmayı yazı
          diline çevirmek ve konuya göre bölüm açmak için yapay zekâ gerekir.
          Cloudflare’in ücretsiz katmanı günde binlerce madde işler ve kredi kartı istemez.
        </p>

        <Alan
          etiket="Hesap kimliği (Account ID)"
          aciklama="dash.cloudflare.com → AI → Workers AI → Use REST API"
        >
          <input
            type="text"
            value={ayarlar.zekaHesap}
            onChange={(olay) => ayarla('zekaHesap')(olay.target.value.trim())}
            placeholder="32 haneli kimlik"
            autoComplete="off"
            spellCheck={false}
            className={girdiSinifi}
          />
        </Alan>

        <Alan
          etiket="API anahtarı"
          aciklama="Workers AI Read + Edit yetkili bir token. Boşsa akıllı not kapalı kalır."
        >
          <input
            type="password"
            value={ayarlar.zekaAnahtari}
            onChange={(olay) => ayarla('zekaAnahtari')(olay.target.value.trim())}
            autoComplete="off"
            className={girdiSinifi}
          />
        </Alan>

        <Alan etiket="Model">
          <select
            value={ayarlar.zekaModel}
            onChange={(olay) => ayarla('zekaModel')(olay.target.value)}
            className={girdiSinifi}
          >
            {Object.entries(ZEKA_MODELLERI).map(([id, model]) => (
              <option key={id} value={id}>
                {model.ad}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {ZEKA_MODELLERI[ayarlar.zekaModel]?.aciklama}
          </p>
        </Alan>

        <Alan
          etiket="Aracı adresi (zorunlu)"
          aciklama="Cloudflare tarayıcıdan doğrudan çağrılamıyor. Kendi hesabınızda ücretsiz bir Worker kurulur; kurulumu depoda worker/KURULUM.md dosyasında."
        >
          <input
            type="url"
            value={ayarlar.zekaAraci}
            onChange={(olay) => ayarla('zekaAraci')(olay.target.value.trim())}
            placeholder="https://ders-notu-araci.hesabiniz.workers.dev"
            autoComplete="off"
            spellCheck={false}
            className={girdiSinifi}
          />
        </Alan>
      </Kart>

      <Kart className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Gizlilik</h3>
        <ul className="space-y-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <li>
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              Not çıkarma cihazınızda kalır.
            </span>{' '}
            Metinden not üretme kural tabanlıdır ve tamamen çevrimdışı çalışır.
          </li>
          <li>
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              Ses dışarı çıkar.
            </span>{' '}
            Yüklediğiniz dosya seçtiğiniz çevirme servisine gider. Canlı dinlemede de
            tarayıcı sesi Google’ın sunucularına gönderir — bu, tarayıcının kendi
            davranışıdır ve kapatılamaz.
          </li>
          <li>
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              Akıllı not açıksa metin de çıkar.
            </span>{' '}
            Ders çözümü Cloudflare’e gönderilir. Arapça alıntılar gönderilmeden önce
            metinden çıkarılır; yapay zekâ onları hiç görmez.
          </li>
          <li>
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              Kayıtlar bu cihazda durur.
            </span>{' '}
            Dersler tarayıcının yerel veritabanında (IndexedDB) saklanır; tarayıcı
            verilerini silerseniz kayıtlar da silinir.
          </li>
          <li>
            Dersinizde başka kişilerin sesi de kayda giriyorsa, sesi bir servise
            göndermeden önce bunu göz önünde bulundurun.
          </li>
        </ul>
      </Kart>
    </div>
  );
}
