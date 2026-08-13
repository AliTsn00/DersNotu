// Doğrulanmış âyetleri mushaf metniyle değiştirir.
//
// Konuşma tanıma tilaveti çoğu zaman bozuk yazar; bozuk bir âyetin notta
// kalması, onu okuyan için yanlış bilgi demektir. Uzun süre buna dokunmadık,
// çünkü düzeltmenin tek kaynağı modelin ezberi olurdu — uydurulmuş bir âyet,
// bozuk bir âyetten çok daha tehlikelidir.
//
// Artık kaynak model değil, Tanzil'in denetlenmiş metni. İbare Kur'ân'da
// birebir bulunduysa yerine mushaf metnini koymak tahmin değil, doğrulanmış
// metni yazmaktır.
//
// Üç sınır korunur:
//
//   1. Yalnızca **kesin** eşleşme değiştirilir. Yaklaşık eşleşme kullanıcıya
//      öneri olarak gösterilir, kendiliğinden uygulanmaz.
//   2. İbare âyetin küçük bir parçasıysa dokunulmaz. Parçayı tam âyetle
//      değiştirmek düzeltmek değil, bilgi eklemek olurdu.
//   3. Değiştirilen her madde işaretlenir; kullanıcı özgün metni görebilir.

/**
 * Bir parçanın tam âyetle değiştirilebilmesi için kaplaması gereken en az oran.
 * Altında kalan ibareler âyetin bir bölümüdür; künyesi yazılır, metni durur.
 */
const EN_AZ_KAPSAMA = 0.6;

/** Bu sonuç, maddenin metnini değiştirmeyi haklı çıkarıyor mu? */
export function duzeltilebilirMi(sonuc) {
  return Boolean(
    sonuc &&
      sonuc.durum === 'kesin' &&
      sonuc.metin &&
      (sonuc.kapsama ?? 0) >= EN_AZ_KAPSAMA,
  );
}

/** Maddeyi doğrulanmış metinle günceller; değişiklik olduysa true döner. */
function maddeyiDuzelt(madde, sonuc) {
  if (!duzeltilebilirMi(sonuc) || madde.metin === sonuc.metin) return false;
  madde.ozgunMetin = madde.metin;
  madde.metin = sonuc.metin;
  madde.kaynakKunyesi = sonuc.kunye;
  madde.mushaftanDuzeltildi = true;
  // Künye artık tahmin değil; "doğrulanmadı" damgası yanıltıcı olurdu.
  madde.dogrulanmadi = false;
  return true;
}

/**
 * Notun bir kopyasını doğrulanmış âyetlerle günceller.
 *
 * Not nesnesi kopyalanır: kaydedilen ve düzenlenen not ham hâliyle kalsın,
 * düzeltme her açılışta doğrulamadan yeniden türetilsin. Böylece Kur'ân metni
 * güncellenirse eski notlar da düzelmiş olur.
 *
 * @param {object} not
 * @param {Map<string, object>} sonuclar madde kimliği → doğrulama sonucu
 * @returns {{not: object, duzeltilen: number}}
 */
export function ayetleriDuzelt(not, sonuclar) {
  if (!not || !sonuclar?.size) return { not, duzeltilen: 0 };

  const kopya = structuredClone(not);
  let duzeltilen = 0;

  for (const bolum of kopya.bolumler || []) {
    for (const grup of bolum.gruplar || []) {
      for (const madde of grup.maddeler || []) {
        if (maddeyiDuzelt(madde, sonuclar.get(madde.id))) duzeltilen += 1;
        for (const alt of madde.alt || []) maddeyiDuzelt(alt, sonuclar.get(alt.id));
      }
    }
  }

  // Alıntı dizinleri de aynı metni göstermeli; yoksa notun sonundaki
  // "Geçen Âyetler" listesi bozuk metni sürdürür.
  for (const alan of ['ayetler', 'hadisler', 'dualar']) {
    for (const kayit of kopya[alan] || []) {
      const sonuc = sonuclar.get(kayit.id);
      if (!duzeltilebilirMi(sonuc)) continue;
      kayit.metin = sonuc.metin;
      kayit.kunye = sonuc.kunye;
    }
  }

  return { not: duzeltilen ? kopya : not, duzeltilen };
}

/**
 * Tek bir maddeye mushaf metnini kullanıcı isteğiyle uygular.
 *
 * Yaklaşık eşleşmeler kendiliğinden uygulanmaz — motor bambaşka bir âyeti en
 * yakın sayabilir. Kararı okuyana bırakmak doğrusu; bu işlev o kararın
 * sonucudur, kalıcı nota yazılır.
 */
export function ayetiElleUygula(not, maddeId, sonuc) {
  if (!not || !maddeId || !sonuc?.metin) return not;

  const kopya = structuredClone(not);
  let bulundu = false;

  const uygula = (madde) => {
    if (madde.id !== maddeId) return false;
    madde.ozgunMetin = madde.ozgunMetin ?? madde.metin;
    madde.metin = sonuc.metin;
    madde.kaynakKunyesi = sonuc.kunye;
    madde.mushaftanDuzeltildi = true;
    madde.dogrulanmadi = false;
    return true;
  };

  for (const bolum of kopya.bolumler || []) {
    for (const grup of bolum.gruplar || []) {
      for (const madde of grup.maddeler || []) {
        if (uygula(madde)) bulundu = true;
        for (const alt of madde.alt || []) if (uygula(alt)) bulundu = true;
      }
    }
  }

  for (const alan of ['ayetler', 'hadisler', 'dualar']) {
    for (const kayit of kopya[alan] || []) {
      if (kayit.id !== maddeId) continue;
      kayit.metin = sonuc.metin;
      kayit.kunye = sonuc.kunye;
      bulundu = true;
    }
  }

  return bulundu ? kopya : not;
}
