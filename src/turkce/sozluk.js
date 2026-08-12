// Türkçe ders anlatımına özgü sözlükler: kısaltmalar, dolgu sözcükleri,
// bağlaçlar, ipucu kalıpları ve etkisiz kelimeler.
// Motorun tamamı bu listelere dayanır; yeni ders tipleri için buraya ekleme yapın.

/** Sonundaki nokta cümle sonu SAYILMAYACAK kısaltmalar (küçük harfli, noktasız). */
export const KISALTMALAR = new Set([
  'vb', 'vs', 'vd', 'bkz', 'örn', 'ör', 'age', 'agm', 'çev', 'ed', 'haz', 'yay',
  'sf', 's', 'ss', 'no', 'nu', 'tel', 'fak', 'md', 'mad', 'bl', 'böl', 'ünt',
  'dr', 'doç', 'prof', 'yrd', 'öğr', 'gör', 'av', 'müh', 'uzm', 'op', 'dt',
  'sn', 'sy', 'bay', 'bn', 'hz', 'st', 'alb', 'gen', 'yzb', 'ütğm', 'tğm',
  'mah', 'cad', 'sok', 'apt', 'kat', 'blv', 'küm',
  'm.ö', 'm.s', 'i.ö', 'i.s', 't.c', 'a.ş', 'ltd', 'şti', 'a.g.e',
  'yy', 'mm', 'cm', 'km', 'kg', 'gr', 'mg', 'lt', 'ml', 'dk', 'sa', 'hz',
  'tl', 'usd', 'eur', 'mrd', 'myn', 'min', 'maks', 'ort', 'yak',
]);

/** Tek başına anlamı olmayan, ASR çıktısında sık görülen dolgu sözcükleri. */
export const DOLGU_SOZCUKLER = new Set([
  'ıı', 'ııı', 'ıııı', 'ee', 'eee', 'eeee', 'aa', 'aaa', 'ııh', 'hı', 'hım',
  'hmm', 'mm', 'mmm', 'aha', 'yaa', 'yaaa',
  'işte', 'hani', 'falan', 'filan', 'falanca',
  'efendim', 'canım', 'yani',
]);

/** Cümlenin başında/sonunda geçtiğinde atılabilecek hitap ve teyit kalıpları. */
export const HITAP_KALIPLARI = [
  'arkadaşlar', 'arkadaslar', 'çocuklar', 'gençler', 'evlat', 'kızlar',
  'tamam mı', 'anladınız mı', 'anlaşıldı mı', 'değil mi', 'oldu mu',
  'peki', 'evet', 'tamamdır', 'güzel', 'hı hı',
];

/** Ders içeriği taşımayan, tamamen atılacak cümle kalıpları (sınıf yönetimi vb.). */
export const GEREKSIZ_KALIPLAR = [
  'günaydın', 'iyi günler', 'iyi dersler', 'hoş geldiniz', 'merhaba',
  'yoklama', 'devamsızlık', 'zil çaldı', 'zil çalınca', 'teneffüs',
  'telefonları', 'telefonunu', 'sessiz olun', 'susun', 'gürültü',
  'ses geliyor mu', 'sesim geliyor mu', 'duyuyor musunuz', 'beni duyuyor',
  'kayıt başladı', 'kayda başlıyorum', 'mikrofon', 'ekranı görüyor musunuz',
  'kamera', 'bağlantı koptu', 'internet', 'dersin sonu', 'çıkabilirsiniz',
  'bir dahaki derste görüşürüz', 'hadi bakalım', 'kolay gelsin',
];

/**
 * Yeni cümle başlatan bağlaç ve geçiş ifadeleri.
 * ASR çıktısında noktalama olmadığı için bölütleme bunlara dayanır.
 */
export const CUMLE_BASI_BAGLAC = [
  'ayrıca', 'ancak', 'fakat', 'lakin', 'oysa', 'oysaki', 'halbuki',
  'bu yüzden', 'bu nedenle', 'bu sebeple', 'o yüzden', 'dolayısıyla',
  'sonuç olarak', 'sonuçta', 'özetle', 'kısacası', 'toparlarsak', 'demek ki',
  'örneğin', 'örnek olarak', 'mesela', 'diyelim ki', 'farz edelim',
  'şimdi', 'peki', 'bakın', 'dikkat edin', 'unutmayın', 'aklınızda kalsın',
  'bunun yanında', 'bununla birlikte', 'öte yandan', 'diğer taraftan',
  'buna karşın', 'buna rağmen', 'aynı zamanda', 'bir de', 'bu arada',
  'ilk olarak', 'ikinci olarak', 'üçüncü olarak', 'son olarak', 'öncelikle',
  'birincisi', 'ikincisi', 'üçüncüsü', 'dördüncüsü', 'beşincisi',
  'gördüğünüz gibi', 'anlaşılacağı gibi', 'yukarıda', 'burada önemli olan',
  'tabii ki', 'tabi ki', 'elbette', 'kesinlikle', 'özellikle',
];

/**
 * Cümle ortasında neredeyse hiç geçmeyen bağlaçlar.
 * Bunlardan önce yüklem aranmadan doğrudan cümle bölünebilir.
 */
export const GUCLU_BAGLAC = new Set([
  'ayrıca', 'ancak', 'fakat', 'oysa', 'oysaki', 'halbuki',
  'bu yüzden', 'bu nedenle', 'bu sebeple', 'o yüzden', 'dolayısıyla',
  'sonuç olarak', 'özetle', 'kısacası', 'toparlarsak', 'demek ki',
  'örneğin', 'örnek olarak', 'mesela', 'diyelim ki', 'farz edelim',
  'şimdi', 'peki', 'bakın', 'dikkat edin', 'unutmayın',
  'bunun yanında', 'bununla birlikte', 'öte yandan', 'diğer taraftan',
  'buna karşın', 'buna rağmen', 'bir de', 'bu arada',
  'ilk olarak', 'ikinci olarak', 'üçüncü olarak', 'son olarak', 'öncelikle',
  'birincisi', 'ikincisi', 'üçüncüsü', 'dördüncüsü', 'beşincisi',
  'gördüğünüz gibi',
]);

/** Başlık cümlesinden atılacak kalıp kelimeler. */
export const BASLIK_GURULTUSU = new Set([
  'günaydın', 'merhaba', 'selam', 'evet', 'peki', 'şimdi', 'artık', 'hadi',
  'gelin', 'tamam', 'arkadaşlar', 'çocuklar', 'gençler',
  'bugün', 'bugünkü', 'bugünden', 'itibaren', 'geçen', 'derste', 'dersimizde',
  'dersin', 'dersimiz', 'ders', 'dersimizin',
  'konu', 'konumuz', 'konusu', 'konusunu', 'konusuna', 'konuya', 'konuyu',
  'konular', 'konumuzun', 'başlık', 'başlığımız', 'başlığı', 'başlığına',
  'ünite', 'ünitemiz', 'ünitesi', 'ünitesine', 'üniteye', 'ünitenin',
  'bölüm', 'bölümümüz', 'bölümü', 'bölüme', 'bölümüne',
  'işleyeceğiz', 'işliyoruz', 'işleyelim', 'göreceğiz', 'görüyoruz', 'görelim',
  'anlatacağım', 'anlatıyorum', 'başlıyoruz', 'başlayalım', 'başlıyorum',
  'geçelim', 'geçiyoruz', 'geçeceğiz', 'öğreneceğiz', 'inceleyeceğiz',
  'bakalım', 'bakacağız', 'bakıyoruz', 'olacak', 'olacaktır', 'şudur', 'şu',
  'budur', 'yeni', 'bir',
]);

/** Başlıkta "konu adı" işlevi gören kelimeler (sıra sıfatı budaması için). */
export const KONU_ADLARI = new Set([
  'konu', 'konumuz', 'konusu', 'konusunu', 'konusuna', 'konuya', 'konuyu',
  'başlık', 'başlığımız', 'başlığı', 'ünite', 'ünitemiz', 'ünitesi', 'üniteye',
  'bölüm', 'bölümümüz', 'bölümü', 'bölüme', 'ders', 'dersimiz',
]);

export const SIRA_SIFATLARI = new Set([
  'ilk', 'birinci', 'ikinci', 'üçüncü', 'dördüncü', 'beşinci', 'son', 'sonuncu',
]);

/** Yüklem olduğu neredeyse kesin olan kelimeler (kip eki taşımayanlar dahil). */
export const YUKLEM_KELIMELER = new Set([
  'var', 'yok', 'vardır', 'yoktur', 'değil', 'değildir', 'mevcut', 'mevcuttur',
  'olur', 'olmaz', 'oldu', 'olmuş', 'olacak', 'oluyor', 'oluşur', 'oluşuyor',
  'denir', 'denilir', 'deriz', 'diyoruz', 'demektir', 'gerekir', 'gerekiyor',
  'gelir', 'gider', 'alır', 'verir', 'yapar', 'eder', 'bilir', 'görür',
  'çıkar', 'artar', 'azalır', 'değişir', 'kalır', 'sayılır', 'bulunur',
  'geçer', 'biter', 'başlar', 'dönüşür', 'etkiler', 'sağlar', 'taşır',
  'içerir', 'gösterir', 'ayrılır', 'oluşturur', 'meydana', 'lazım', 'şart',
]);

/** Anahtar kavram çıkarımında sayılmayacak kelimeler. */
export const ETKISIZ_KELIMELER = new Set([
  've', 'ile', 'veya', 'ya', 'yada', 'ama', 'fakat', 'ancak', 'çünkü', 'ki',
  'de', 'da', 'ise', 'gibi', 'için', 'kadar', 'göre', 'sonra', 'önce', 'daha',
  'çok', 'az', 'en', 'her', 'bir', 'bu', 'şu', 'o', 'bunlar', 'şunlar',
  'onlar', 'biz', 'siz', 'ben', 'sen', 'kendi', 'hem', 'değil', 'yok', 'var',
  'olan', 'olarak', 'olduğu', 'olduğunu', 'oldu', 'olur', 'olmak', 'yani',
  'şey', 'şeyi', 'şeyler', 'zaman', 'şimdi', 'burada', 'orada', 'nasıl',
  'neden', 'niçin', 'hangi', 'kim', 'nerede', 'kaç', 'bütün', 'tüm', 'bazı',
  'yine', 'ayrıca', 'artık', 'sadece', 'yalnız', 'birlikte', 'aynı', 'başka',
  'diğer', 'böyle', 'şöyle', 'işte', 'tekrar', 'karşı', 'doğru', 'üzere',
  'arkadaşlar', 'ders', 'konu', 'konusu', 'bugün', 'dün', 'yarın', 'hocam',
]);

/** Cümle rolü ipuçları — sıralama önemlidir, ilk eşleşen kazanır. */
export const IPUCU_KALIPLARI = {
  baslik: [
    'bugün .* (işleyeceğiz|göreceğiz|anlatacağım|başlıyoruz|öğreneceğiz)',
    'bu (dersin|derste) konu(muz|su)',
    'konu(muz|su) (şu|şudur)?',
    'yeni (bir )?(konu|üniteye|bölüme)',
    '(şimdi|artık) .* (geçelim|geçiyoruz|başlayalım|bakalım)',
    '^(ünite|bölüm|konu|başlık)\\b',
    '.* (konusuna|ünitesine|bölümüne) (geçiyoruz|başlıyoruz|geçelim)',
    '(ilk|birinci|ikinci|üçüncü|son) (konu|başlık|ünite|bölüm)',
  ],
  onemli: [
    '(çok )?önemli', 'altını çiz', 'not al', 'unutmayın', 'aklınızda',
    'sınavda çık', 'sınav sorusu', 'kesinlikle bil', 'mutlaka',
    'dikkat edin', 'dikkat!', 'sakın', 'karıştırmayın', 'püf nokta',
    'yanlış (yapılan|bilinen)', 'sık sorulan',
  ],
  ornek: [
    '^örneğin', '^örnek', '^mesela', 'örnek olarak', 'örnek verecek',
    '^diyelim ki', '^farz edelim', '^düşünün ki', 'şöyle bir örnek',
  ],
  ozet: [
    '^sonuç olarak', '^özetle', '^kısacası', '^toparlarsak', '^özetlersek',
    'kısaca söylemek gerekirse', '^demek ki', 'genel olarak baktığımızda',
  ],
  listeBasi: [
    'şunlardır', 'şöyledir', 'şu şekildedir', 'aşağıdaki gibidir',
    '(ikiye|üçe|dörde|beşe|altıya|yediye) ayrılır',
    // "üç tane", "iki temel aşaması" gibi sayı + (sıfat) + tür adı kalıpları
    '(iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on)\\s+(\\p{L}+\\s+)?(tane|tanesi|çeşit|çeşidi|tür|türü|aşama|aşaması|evre|evresi|madde|maddesi|başlık|başlığı|grup|grubu|kısım|kısmı|adım|adımı|özellik|özelliği|neden|nedeni|sonuç|sonucu|ilke|ilkesi)',
    // "aşaması vardır", "türleri bulunur"
    '(aşama|evre|tür|çeşit|madde|başlık|grup|kısım|özellik|neden|sonuç|ilke|adım)(sı|si|su|sü|ları|leri|lar|ler)?\\s+(var|vardır|bulunur|mevcuttur|olur)',
    'başlıca', 'temel (özellikleri|ilkeleri|nedenleri|sonuçları|türleri)',
    '(özellikleri|ilkeleri|nedenleri|sonuçları|türleri|çeşitleri|aşamaları|maddeleri)',
    'sıralayacak olursak', 'maddeler halinde',
  ],
  madde: [
    '^birincisi', '^ikincisi', '^üçüncüsü', '^dördüncüsü', '^beşincisi',
    '^altıncısı', '^yedincisi', '^sonuncusu',
    '^ilk olarak', '^ikinci olarak', '^üçüncü olarak', '^son olarak',
    '^bir diğeri', '^bir başkası', '^bunlardan biri', '^diğeri',
    '^önce\\b', '^sonra\\b', '^daha sonra', '^ardından', '^en son',
    '^\\d+[).\\-]', '^-\\s',
  ],
};

/** Tanım cümlesi belirteçleri. `terimSonda` = terim belirtecin hemen öncesindedir. */
export const TANIM_BELIRTECLERI = [
  { kalip: ' adı verilir', terimSonda: true },
  { kalip: ' adını alır', terimSonda: true },
  { kalip: ' adı verilen', terimSonda: true },
  { kalip: ' olarak adlandırılır', terimSonda: true },
  { kalip: ' denilir', terimSonda: true },
  { kalip: ' denir', terimSonda: true },
  { kalip: ' deriz', terimSonda: true },
  { kalip: ' diyoruz', terimSonda: true },
  { kalip: ' demektir', terimSonda: false },
  { kalip: ' anlamına gelir', terimSonda: false },
  { kalip: ' olarak tanımlanır', terimSonda: false },
  { kalip: ' şu demektir', terimSonda: false },
  { kalip: ' tanımı şudur', terimSonda: false },
  { kalip: ' ifade eder', terimSonda: false },
];

/** Soru kelimeleri. */
export const SORU_KELIMELERI = new Set([
  'ne', 'neyi', 'neye', 'neyin', 'nedir', 'neler', 'neden', 'niye', 'niçin',
  'nasıl', 'kim', 'kimi', 'kime', 'kimin', 'kaç', 'kaçı', 'kaçıncı', 'hangi',
  'hangisi', 'hangileri', 'nerede', 'nereye', 'nereden', 'nerelerde', 'kaçta',
]);

/** Soru eki (ayrı yazılan mı/mi/mu/mü ve çekimleri). */
export const SORU_EKI = /^(mı|mi|mu|mü)(yım|yim|yum|yüm|sın|sin|sun|sün|yız|yiz|yuz|yüz|sınız|siniz|sunuz|sünüz|lar|ler|dır|dir|dur|dür)?$/;
