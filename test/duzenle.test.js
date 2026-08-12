import { describe, it, expect } from 'vitest';
import { notCikar } from '../src/turkce/index.js';
import {
  duzenlemeyeAl,
  maddeMetniDegistir,
  maddeSil,
  maddeTasi,
  maddeSeviyeDegistir,
  maddeTuruDegistir,
  maddeEkle,
  bolumBasligiDegistir,
  bolumEkle,
  listeGuncelle,
  yeniMaddeleriKat,
  maddeleriGez,
} from '../src/turkce/duzenle.js';

const DERS = [
  'bugün sabır konusunu işleyeceğiz',
  'sabır musibetlere karşı direnç göstermesine denir',
  'sabrın üç çeşidi vardır',
  'birincisi ibadetlere devam etmektir',
  'ikincisi günahlardan kaçınmaktır',
  'bu çok önemli sınavda çıkar',
].join('\n');

const ustMaddeler = (not) =>
  not.bolumler.flatMap((bolum) => bolum.gruplar.flatMap((grup) => grup.maddeler));

describe('Not düzenleme', () => {
  const otomatik = notCikar(DERS, { detay: 'orta' });

  it('düzenlemeye alınan not işaretlenir', () => {
    const not = duzenlemeyeAl(otomatik);
    expect(not.elleDuzenlendi).toBe(true);
    expect(not.bolumler.length).toBeGreaterThan(0);
  });

  it('madde metnini değiştirir', () => {
    const not = duzenlemeyeAl(otomatik);
    const hedef = ustMaddeler(not)[0];
    const yeni = maddeMetniDegistir(not, hedef.id, 'Elle yazılmış metin.');
    expect(ustMaddeler(yeni)[0].metin).toBe('Elle yazılmış metin.');
    // özgün not değişmemeli
    expect(ustMaddeler(not)[0].metin).toBe(hedef.metin);
  });

  it('madde siler ve numaraları tazeler', () => {
    const not = duzenlemeyeAl(otomatik);
    const oncekiSayi = ustMaddeler(not).length;
    const yeni = maddeSil(not, ustMaddeler(not)[0].id);
    expect(ustMaddeler(yeni)).toHaveLength(oncekiSayi - 1);
    expect(ustMaddeler(yeni)[0].numara).toBe('1.1');
  });

  it('maddeyi aşağı taşır', () => {
    const not = duzenlemeyeAl(otomatik);
    const [ilk, ikinci] = ustMaddeler(not);
    const yeni = maddeTasi(not, ilk.id, 'asagi');
    expect(ustMaddeler(yeni)[0].id).toBe(ikinci.id);
    expect(ustMaddeler(yeni)[1].id).toBe(ilk.id);
  });

  it('maddeyi bir alt seviyeye indirir ve geri çıkarır', () => {
    const not = duzenlemeyeAl(otomatik);
    const ikinci = ustMaddeler(not)[1];
    const indirilmis = maddeSeviyeDegistir(not, ikinci.id, 'indir');
    expect(ustMaddeler(indirilmis)[0].alt.some((a) => a.id === ikinci.id)).toBe(true);

    const cikarilmis = maddeSeviyeDegistir(indirilmis, ikinci.id, 'cikar');
    expect(ustMaddeler(cikarilmis).some((m) => m.id === ikinci.id)).toBe(true);
  });

  it('tür değişince ek bölümler yeniden kurulur', () => {
    const not = duzenlemeyeAl(otomatik);
    const hedef = ustMaddeler(not).find((m) => m.tur !== 'onemli');
    const yeni = maddeTuruDegistir(not, hedef.id, 'onemli');
    expect(yeni.onemliler).toContain(hedef.metin);
  });

  it('yeni madde ekler', () => {
    const not = duzenlemeyeAl(otomatik);
    const oncekiSayi = ustMaddeler(not).length;
    const yeni = maddeEkle(not, ustMaddeler(not)[0].id);
    expect(ustMaddeler(yeni)).toHaveLength(oncekiSayi + 1);
    expect(ustMaddeler(yeni)[1].metin).toBe('');
  });

  it('bölüm başlığını değiştirir ve bölüm ekler', () => {
    const not = duzenlemeyeAl(otomatik);
    const adlandirilmis = bolumBasligiDegistir(not, not.bolumler[0].id, 'Sabrın Tanımı');
    expect(adlandirilmis.bolumler[0].baslik).toBe('Sabrın Tanımı');

    const eklenmis = bolumEkle(adlandirilmis, 'İkinci Bölüm');
    expect(eklenmis.bolumler).toHaveLength(2);
    expect(eklenmis.bolumler[1].numara).toBe('2');
  });

  it('özet listesini günceller ve boş satırları atar', () => {
    const not = duzenlemeyeAl(otomatik);
    const yeni = listeGuncelle(not, 'ozet', ['Birinci', '', '  ', 'İkinci']);
    expect(yeni.ozet).toEqual(['Birinci', 'İkinci']);
  });
});

describe('Canlı derste düzenlemeyi koruma', () => {
  it('yeni cümleleri düzenlenmiş nota ekler, elle değişikliği bozmaz', () => {
    const ilkNot = notCikar(DERS, { detay: 'orta' });
    let elle = duzenlemeyeAl(ilkNot);
    const hedef = ustMaddeler(elle)[0];
    elle = maddeMetniDegistir(elle, hedef.id, 'ELLE DÜZENLENDİ');

    const genisletilmis = notCikar(
      `${DERS}\nsonuç olarak sabır imanın yarısıdır\nsabır insanı olgunlaştıran bir kalkandır`,
      { detay: 'orta' },
    );
    const birlesik = yeniMaddeleriKat(elle, genisletilmis);

    expect(ustMaddeler(birlesik)[0].metin).toBe('ELLE DÜZENLENDİ');
    expect([...maddeleriGez(birlesik)].some((k) => /kalkandır/i.test(k.madde.metin))).toBe(true);
    expect(birlesik.sonKaynak).toBe(genisletilmis.sonKaynak);
  });

  it('yeni cümle yoksa aynı nesneyi döner', () => {
    const not = notCikar(DERS, { detay: 'orta' });
    const elle = duzenlemeyeAl(not);
    expect(yeniMaddeleriKat(elle, not)).toBe(elle);
  });
});
