// Canlı dinlemede tekrar eden kesin sonuçların ayıklanması.
//
// Android Chrome aynı konuşmayı birden çok kez "kesin" diye bildirir ve her
// bildirimde biraz daha uzatır. Bu testler, gerçek bir telefondan alınan
// bildirim dizisinin tek satıra indiğini doğrular.

import { describe, it, expect } from 'vitest';
import { kesinKarari, kesiniKat } from '../src/core/dinleme.js';

describe('kesinKarari', () => {
  it('ilk metni ekler', () => {
    expect(kesinKarari('Selamünaleyküm', '')).toBe('ekle');
  });

  it('aynı metin tekrar gelirse yoksayar', () => {
    expect(kesinKarari('Selamünaleyküm', 'Selamünaleyküm')).toBe('yoksay');
  });

  it('uzayan metinde son satırı değiştirir', () => {
    expect(kesinKarari('Selamünaleyküm değerli', 'Selamünaleyküm')).toBe('degistir');
  });

  it('kısalan metni yoksayar', () => {
    expect(kesinKarari('Selamünaleyküm', 'Selamünaleyküm değerli')).toBe('yoksay');
  });

  it('yeni bir cümleyi ekler', () => {
    expect(kesinKarari('Nasılsınız', 'Selamünaleyküm değerli kardeşlerim')).toBe('ekle');
  });

  it('boş metni yoksayar', () => {
    expect(kesinKarari('', 'Selamünaleyküm')).toBe('yoksay');
    expect(kesinKarari('   ', 'Selamünaleyküm')).toBe('yoksay');
  });

  it('baştaki ve sondaki boşluğu önemsemez', () => {
    expect(kesinKarari('  Selamünaleyküm  ', 'Selamünaleyküm')).toBe('yoksay');
  });

  // Motor aynı sözü bazen büyük harfe çevirip yeniden bildiriyor.
  it('yalnızca büyük/küçük harfi değişen metni tekrar sayar', () => {
    expect(kesinKarari('Bugün sizlerle Peygamber', 'bugün sizlerle peygamber')).toBe('yoksay');
  });

  it('harf değişmiş ve uzamışsa yine değiştirir', () => {
    expect(kesinKarari('Bugün sizlerle Peygamber Efendimiz', 'bugün sizlerle peygamber')).toBe(
      'degistir',
    );
  });

  it('Türkçe I/ı kurallarına göre karşılaştırır', () => {
    expect(kesinKarari('İYİSİNİZ', 'iyisiniz')).toBe('yoksay');
    expect(kesinKarari('IŞIK', 'ışık')).toBe('yoksay');
  });
});

describe('kesiniKat', () => {
  it('boş metne ilk cümleyi koyar', () => {
    expect(kesiniKat('', 'Selam', false)).toBe('Selam');
  });

  it('yeni cümleyi alt satıra ekler', () => {
    expect(kesiniKat('Selam', 'Nasılsınız', false)).toBe('Selam\nNasılsınız');
  });

  it('değiştirirken son satırın üzerine yazar', () => {
    expect(kesiniKat('Selam\nNasılsınız', 'Nasılsınız iyi misiniz', true)).toBe(
      'Selam\nNasılsınız iyi misiniz',
    );
  });

  it('tek satırlık metinde tamamını değiştirir', () => {
    expect(kesiniKat('Selam', 'Selam değerli', true)).toBe('Selam değerli');
  });
});

describe('gerçek telefon dizisi', () => {
  // 13 Ağustos 2026, Redmi 23117RA68G, Chrome 150, tr-TR.
  // Motorun sırayla bildirdiği kesin sonuçlar:
  const bildirimler = [
    'Selamünaleyküm',
    'Selamünaleyküm',
    'Selamünaleyküm',
    'Selamünaleyküm değerli',
    'Selamünaleyküm değerli kardeşlerim',
    'Nasılsınız',
    'Nasılsınız',
    'Nasılsınız İyisiniz',
    'Nasılsınız İyisiniz inşallah',
    'Bugün',
    'Bugün',
    'Bugün sizlerle',
  ];

  it('on iki bildirimi üç cümleye indirir', () => {
    let hamMetin = '';
    let sonKesin = '';

    for (const metin of bildirimler) {
      const karar = kesinKarari(metin, sonKesin);
      if (karar === 'yoksay') continue;
      sonKesin = metin;
      hamMetin = kesiniKat(hamMetin, metin, karar === 'degistir');
    }

    expect(hamMetin.split('\n')).toEqual([
      'Selamünaleyküm değerli kardeşlerim',
      'Nasılsınız İyisiniz inşallah',
      'Bugün sizlerle',
    ]);
  });

  it('düzeltme öncesi davranış on iki satır üretiyordu', () => {
    // Eski kod her bildirimi yeni satır sayıyordu; hatanın büyüklüğü buydu.
    const eski = bildirimler.reduce((a, m) => (a ? `${a}\n${m}` : m), '');
    expect(eski.split('\n')).toHaveLength(12);
  });
});

describe('gerçek ders kaydı — Peygamber Dersi', () => {
  // Aynı cihazdan alınan 79 saniyelik gerçek kayıt. Motor burada büyük/küçük
  // harfi de değiştirerek tekrar ettiği için daha zorlu bir örnek.
  const bildirimler = [
    'Bugün', 'Bugün', 'Bugün sizlerle',
    'Bugün sizlerle peygamber',
    'Bugün sizlerle Peygamber',
    'Bugün sizlerle Peygamber',
    'Bugün sizlerle Peygamber Efendimiz',
    'Bugün sizlerle Peygamber Efendimiz',
    'Bugün sizlerle peygamber efendimiz',
    'Bugün sizlerle peygamber efendimiz sallallahu',
    'Bugün sizlerle peygamber efendimiz sallallahu aleyhi',
    'Bugün sizlerle peygamber efendimiz sallallahu aleyhi ve',
    'Bugün sizlerle peygamber efendimiz sallallahu aleyhi ve sellem',
    'bugün sahabe efendilerimiz',
  ];

  it('on dört bildirimi iki cümleye indirir', () => {
    let hamMetin = '';
    let sonKesin = '';
    for (const metin of bildirimler) {
      const karar = kesinKarari(metin, sonKesin);
      if (karar === 'yoksay') continue;
      sonKesin = metin;
      hamMetin = kesiniKat(hamMetin, metin, karar === 'degistir');
    }
    expect(hamMetin.split('\n')).toEqual([
      'Bugün sizlerle peygamber efendimiz sallallahu aleyhi ve sellem',
      'bugün sahabe efendilerimiz',
    ]);
  });
});
