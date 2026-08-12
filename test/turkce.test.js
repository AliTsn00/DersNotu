import { describe, it, expect } from 'vitest';
import { trKucuk, trBuyuk, basHarfiBuyut, baslikBicimle } from '../src/turkce/harf.js';
import { metniTemizle, tekrarlariSil, benzerlik } from '../src/turkce/temizle.js';
import { cumleleriAyir, yuklemMi } from '../src/turkce/cumle.js';
import { soruMu, cumleyiBicimle } from '../src/turkce/noktalama.js';
import { cumleyiSiniflandir, tanimCikar, baslikCikar } from '../src/turkce/siniflandir.js';
import { govdele, anahtarKavramlar } from '../src/turkce/anahtar.js';
import { notCikar } from '../src/turkce/index.js';
import { markdownYaz } from '../src/turkce/bicim.js';

/** Nottaki bütün maddeleri (bölüm → grup → madde) düz listeye indirir. */
const tumMaddeler = (not) =>
  not.bolumler.flatMap((bolum) => bolum.gruplar.flatMap((grup) => grup.maddeler));

describe('Türkçe harf dönüşümleri', () => {
  it('I/İ çiftini doğru çevirir', () => {
    expect(trKucuk('IŞIK')).toBe('ışık');
    expect(trKucuk('İSTANBUL')).toBe('istanbul');
    expect(trBuyuk('ışık')).toBe('IŞIK');
    expect(trBuyuk('istanbul')).toBe('İSTANBUL');
  });

  it('cümle baş harfini Türkçe kuralına göre büyütür', () => {
    expect(basHarfiBuyut('ışık enerjisi')).toBe('Işık enerjisi');
    expect(basHarfiBuyut('iyon bağı')).toBe('İyon bağı');
  });

  it('başlıkta bağlaçları küçük bırakır', () => {
    expect(baslikBicimle('ışık ve gölge')).toBe('Işık ve Gölge');
  });
});

describe('Temizlik', () => {
  it('ardışık kelime tekrarlarını siler', () => {
    expect(tekrarlariSil('bu bu konu çok çok önemli')).toBe('bu konu çok önemli');
  });

  it('dolgu sözcüklerini ve hitapları atar', () => {
    const sonuc = metniTemizle('eee arkadaşlar yani fotosentez çok önemlidir tamam mı');
    expect(sonuc).not.toMatch(/eee|arkadaşlar|tamam mı/);
    expect(sonuc).toContain('fotosentez');
  });

  it('benzer cümleleri yakalar', () => {
    expect(benzerlik('fotosentez bitkilerde görülür', 'fotosentez bitkilerde görülür')).toBe(1);
    expect(benzerlik('fotosentez', 'osmanlı devleti')).toBe(0);
  });
});

describe('Cümle bölütleme', () => {
  it('kısaltmadaki noktada bölmez', () => {
    const cumleler = cumleleriAyir('Bu konu Prof. Ahmet Bey tarafından anlatıldı. Sonra devam ettik.');
    expect(cumleler).toHaveLength(2);
    expect(cumleler[0]).toContain('Prof. Ahmet');
  });

  it('ondalık sayıda ve sıra sayısında bölmez', () => {
    expect(cumleleriAyir('Pi sayısı 3.14 olarak alınır.')).toHaveLength(1);
    expect(cumleleriAyir('1. Dünya Savaşı 1914 yılında başladı.')).toHaveLength(1);
  });

  it('noktalamasız konuşmayı yüklem + bağlaç desenine göre böler', () => {
    const cumleler = cumleleriAyir(
      'fotosentez bitkilerde gerçekleşen bir olaydır ayrıca klorofil pigmenti bu olayda görev alır',
    );
    expect(cumleler.length).toBeGreaterThanOrEqual(2);
    expect(cumleler[1]).toMatch(/^ayrıca/);
  });

  it('yüklem tespitini yapar', () => {
    expect(yuklemMi('gerçekleşir')).toBe(true);
    expect(yuklemMi('olaydır')).toBe(true);
    expect(yuklemMi('başlamıştır')).toBe(true);
    expect(yuklemMi('şimdi')).toBe(false);
    expect(yuklemMi('kitap')).toBe(false);
  });
});

describe('Noktalama', () => {
  it('soru ekini yakalar', () => {
    expect(soruMu('fotosentez bitkilerde görülür mü')).toBe(true);
    expect(soruMu('bu konuyu anladınız mı')).toBe(true);
  });

  it('soru kelimesini yakalar', () => {
    expect(soruMu('fotosentez nedir')).toBe(true);
    expect(soruMu('bu olay neden gerçekleşir')).toBe(true);
  });

  it('yan cümledeki soru kelimesini soru saymaz', () => {
    expect(soruMu('bu olayın neden gerçekleştiğini gördük')).toBe(false);
  });

  it('cümleyi biçimlendirir', () => {
    expect(cumleyiBicimle('fotosentez nedir')).toBe('Fotosentez nedir?');
    expect(cumleyiBicimle('ışık enerjisi kullanılır')).toBe('Işık enerjisi kullanılır.');
    expect(cumleyiBicimle('ayrıca klorofil görev alır')).toBe('Ayrıca, klorofil görev alır.');
  });
});

describe('Sınıflandırma', () => {
  it('başlık cümlesinden konuyu çıkarır', () => {
    expect(baslikCikar('Bugün fotosentez konusunu işleyeceğiz')).toBe('Fotosentez');
  });

  it('"denir" kalıbında terimi sondan alır', () => {
    const tanim = tanimCikar('Bitkilerin güneş ışığıyla besin üretmesine fotosentez denir.');
    expect(tanim?.terim).toBe('Fotosentez');
    // Yönelme eki bildirme kipine çevrilir: "üretmesine denir" → "üretmesidir"
    expect(tanim?.aciklama).toMatch(/besin üretmesidir$/);
  });

  it('"demektir" kalıbında terimi baştan alır', () => {
    const tanim = tanimCikar('Fotosentez, bitkilerin besin üretmesi demektir.');
    expect(tanim?.terim).toBe('Fotosentez');
    expect(tanim?.aciklama).toMatch(/besin üretmesi/);
  });

  it('cümle türlerini ayırt eder', () => {
    expect(cumleyiSiniflandir('Bu çok önemli, sınavda çıkar.').tur).toBe('onemli');
    expect(cumleyiSiniflandir('Örneğin yaprakta bu olay görülür.').tur).toBe('ornek');
    expect(cumleyiSiniflandir('Sonuç olarak enerji üretilir.').tur).toBe('ozet');
    expect(cumleyiSiniflandir('Fotosentezin aşamaları şunlardır.').tur).toBe('listeBasi');
    expect(cumleyiSiniflandir('Fotosentezin iki temel aşaması vardır.').tur).toBe('listeBasi');
    expect(cumleyiSiniflandir('Bu olay üçe ayrılır.').tur).toBe('listeBasi');
    expect(cumleyiSiniflandir('Birincisi ışık evresidir.').tur).toBe('madde');
    expect(cumleyiSiniflandir('Telefonları çantaya koyun.').tur).toBe('gereksiz');
    expect(cumleyiSiniflandir('Klorofil yeşil renklidir.').tur).toBe('bilgi');
  });
});

describe('Anahtar kavramlar', () => {
  it('çekim eklerini kırpar', () => {
    expect(govdele('fotosentezin')).toBe('fotosentez');
    expect(govdele('bitkilerde')).toBe('bitki');
  });

  it('sık geçen kavramları döner', () => {
    const kavramlar = anahtarKavramlar([
      'Fotosentez bitkilerde görülür.',
      'Fotosentezin aşamaları vardır.',
      'Bitkiler klorofil taşır.',
    ]);
    expect(kavramlar.map((k) => k.govde)).toContain('fotosentez');
  });
});

describe('Uçtan uca not çıkarımı', () => {
  const ders = [
    'evet arkadaşlar günaydın bugün fotosentez konusunu işleyeceğiz',
    'fotosentez bitkilerin güneş ışığını kullanarak besin üretmesine denir',
    'bu olay klorofil pigmenti sayesinde gerçekleşir ayrıca kloroplast organelinde olur',
    'fotosentezin iki aşaması vardır',
    'birincisi ışık evresidir bu evrede su parçalanır',
    'ikincisi karanlık evredir bu evrede karbondioksit tutulur',
    'bu çok önemli sınavda kesinlikle çıkar',
    'örneğin yaprakların yeşil olmasının sebebi klorofildir',
    'fotosentez hızı ışık şiddetine bağlı mıdır',
    'sonuç olarak bitkiler kendi besinini üreten canlılardır',
    'telefonları çantaya koyun zil çaldı',
  ].join('\n');

  const not = notCikar(ders, { detay: 'orta', sure: 1800 });

  it('başlığı ders konusundan alır', () => {
    expect(not.baslik).toBe('Fotosentez');
  });

  it('tanımı yakalar', () => {
    expect(not.tanimlar.length).toBeGreaterThan(0);
    expect(not.tanimlar[0].terim).toMatch(/[Ff]otosentez/);
  });

  it('liste öğelerini alt maddeye yerleştirir', () => {
    const liste = tumMaddeler(not).find((m) => m.tur === 'listeBasi');
    expect(liste).toBeDefined();
    expect(liste.alt.length).toBeGreaterThanOrEqual(2);
  });

  it('bölümleri ve maddeleri numaralandırır', () => {
    expect(not.bolumler[0].numara).toBe('1');
    expect(tumMaddeler(not)[0].numara).toBe('1.1');
  });

  it('önemli, örnek, soru ve özeti ayırır', () => {
    expect(not.onemliler.length).toBe(1);
    expect(not.ozet.length).toBe(1);
    expect(not.sorular.length).toBe(1);
    expect(tumMaddeler(not).flatMap((m) => m.alt)).toContainEqual(
      expect.objectContaining({ tur: 'ornek' }),
    );
  });

  it('sınıf yönetimi cümlelerini nota almaz', () => {
    const govde = markdownYaz(not);
    expect(govde).not.toMatch(/zil çaldı|çantaya/i);
  });

  it('Markdown çıktısı başlık ve madde içerir', () => {
    const md = markdownYaz(not);
    expect(md).toMatch(/^# Fotosentez/);
    expect(md).toMatch(/^## \d+\. /m);
    expect(md).toMatch(/^- /m);
    expect(md).toMatch(/## Tanımlar/);
  });

  it('kısa detay seviyesi daha az madde üretir', () => {
    const kisa = notCikar(ders, { detay: 'kisa' });
    expect(kisa.istatistik.madde).toBeLessThanOrEqual(not.istatistik.madde);
  });
});
