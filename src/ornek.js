// Uygulamayı mikrofonsuz denemek için örnek ders çözümlemeleri.
// Kasıtlı olarak noktalamasız ve dolgu sözcüklü — gerçek konuşma tanıma çıktısı gibi.

const DINI_DERS = [
  'bismillahirrahmanirrahim',
  'evet arkadaşlar günaydın bugün sabır konusunu işleyeceğiz',
  'sabır kişinin başına gelen musibetlere karşı direnç göstermesine denir',
  'yani ııı insanın kendini tutabilmesi demektir',
  'allah teâlâ bakara suresi 153. ayette şöyle buyuruyor',
  'yâ eyyühellezîne âmenüsteînû bis sabri ves salâh',
  'meali ey iman edenler sabır ve namazla yardım isteyin',
  'peygamber efendimiz sallallahu aleyhi ve sellem buyurdu ki',
  'es sabru dıyâun',
  'bu hadis müslim de geçmektedir',
  'sabrın üç çeşidi vardır',
  'birincisi ibadetlere devam etmekteki sabırdır',
  'ikincisi günahlardan kaçınmadaki sabırdır',
  'üçüncüsü musibetlere karşı gösterilen sabırdır',
  'dikkat edin bu ayrım çok önemli sınavda kesinlikle çıkar',
  'örneğin hz eyyüb aleyhisselamın hastalığına sabretmesi üçüncü türe girer',
  'hanefî mezhebine göre sabır imanın bir cüzü sayılır',
  'peki sabır ile tevekkül arasındaki fark nedir',
  'sonuç olarak sabır imanın yarısıdır',
  'tamam mı arkadaşlar zil çaldı defterleri kapatın',
].join('\n');

const FEN_DERSI = [
  'evet arkadaşlar günaydın bugün fotosentez konusunu işleyeceğiz',
  'fotosentez bitkilerin güneş ışığını kullanarak besin üretmesine denir',
  'bu olay klorofil pigmenti sayesinde gerçekleşir ayrıca kloroplast organelinde olur',
  'fotosentezin iki temel aşaması vardır',
  'birincisi ışık evresidir burada su parçalanır ve oksijen açığa çıkar',
  'ikincisi karanlık evredir bu evrede karbondioksit tutulur',
  'dikkat edin bu ayrım çok önemli sınavda kesinlikle çıkar',
  'örneğin yaprakların yeşil görünmesinin sebebi klorofildir',
  'fotosentez hızı ışık şiddetine sıcaklığa ve karbondioksit miktarına bağlıdır',
  'peki fotosentez gece de devam eder mi',
  'kloroplast demek fotosentezin gerçekleştiği organel demektir',
  'sonuç olarak bitkiler kendi besinini üreten ototrof canlılardır',
  'tamam mı arkadaşlar zil çaldı defterleri kapatın',
].join('\n');

export const ORNEK_DERSLER = [
  { id: 'dini', ad: 'İslami ders (âyet + hadîs)', metin: DINI_DERS, sure: 2700 },
  { id: 'fen', ad: 'Fen dersi', metin: FEN_DERSI, sure: 2400 },
];

export const ORNEK_DERS = DINI_DERS;
