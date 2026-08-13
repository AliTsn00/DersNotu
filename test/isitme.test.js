import { describe, expect, it } from 'vitest';

import {
  duzeltmeOzeti,
  ipucuMetni,
  isitmeyiDuzelt,
  sozlukAyristir,
} from '../src/turkce/isitme.js';

describe('sozlukAyristir', () => {
  it('tek terimi ipucu olarak alır', () => {
    const { terimler, kurallar } = sozlukAyristir('Tirmizî\nSerahsî');
    expect(terimler).toEqual(['Tirmizî', 'Serahsî']);
    expect(kurallar).toHaveLength(0);
  });

  it('eşitlikli satırı düzeltme kuralına çevirir', () => {
    const { terimler, kurallar } = sozlukAyristir("ada olan = Allah'a olan");
    expect(kurallar).toEqual([{ yanlis: 'ada olan', dogru: "Allah'a olan" }]);
    // Doğru biçim aynı zamanda tanıma ipucudur.
    expect(terimler).toEqual(["Allah'a olan"]);
  });

  it('yorum satırlarını ve boşlukları atar', () => {
    const { terimler } = sozlukAyristir('# hocanın terimleri\n\n  Gazâlî  \n');
    expect(terimler).toEqual(['Gazâlî']);
  });

  it('yarım kalmış kuralı yok sayar', () => {
    // "ada =" yazılırsa kelime sessizce silinirdi.
    expect(sozlukAyristir('ada =').kurallar).toHaveLength(0);
    expect(sozlukAyristir('= Allah').kurallar).toHaveLength(0);
  });
});

describe('ipucuMetni', () => {
  it('sözlük boşsa temel ipucunu döndürür', () => {
    expect(ipucuMetni('Ders anlatımı.', '')).toBe('Ders anlatımı.');
  });

  it('terimleri ipucuna ekler', () => {
    expect(ipucuMetni('Ders.', 'Serahsî')).toBe('Ders. Serahsî.');
  });

  it('sınırı aşan terimleri almaz', () => {
    const uzun = Array.from({ length: 200 }, (_, i) => `terim${i}`).join('\n');
    expect(ipucuMetni('Ders.', uzun).length).toBeLessThanOrEqual(850);
  });
});

describe('isitmeyiDuzelt', () => {
  it('yerleşik imlâyı düzeltir', () => {
    const { metin } = isitmeyiDuzelt('Bugün kuranı kerim dersimiz var.');
    expect(metin).toContain("Kur'ân-ı Kerîm");
  });

  it('hadis kaynaklarının imlâsını düzeltir', () => {
    expect(isitmeyiDuzelt('buhari ve muslim rivayet etti').metin).toBe(
      'Buhârî ve Müslim rivayet etti',
    );
  });

  it('kullanıcı kuralını uygular', () => {
    const { metin, duzeltmeler } = isitmeyiDuzelt(
      'Ada olan aşkları anlattı.',
      "ada olan = Allah'a olan",
    );
    expect(metin).toBe("Allah'a olan aşkları anlattı.");
    expect(duzeltmeler[0]).toMatchObject({ dogru: "Allah'a olan", adet: 1 });
  });

  it('kelime ortasındaki eşleşmeyi değiştirmez', () => {
    // "adaylar" içindeki "ada" bozulmamalı.
    expect(isitmeyiDuzelt('adaylar geldi', 'ada = Allah').metin).toBe('adaylar geldi');
  });

  it('Arapça metne dokunmaz', () => {
    const arapca = 'إن الله مع الصابرين';
    expect(isitmeyiDuzelt(arapca, 'الله = Allah').metin).toBe(arapca);
  });

  it('düzeltme yoksa metni ve listeyi boş bırakır', () => {
    const { metin, duzeltmeler } = isitmeyiDuzelt('Sabır güzeldir.');
    expect(metin).toBe('Sabır güzeldir.');
    expect(duzeltmeler).toHaveLength(0);
  });

  it('kaç kez düzelttiğini sayar', () => {
    const { duzeltmeler } = isitmeyiDuzelt('buhari, buhari ve tirmizi');
    const buhari = duzeltmeler.find((kayit) => kayit.dogru === 'Buhârî');
    expect(buhari.adet).toBe(2);
  });

  it('özel karakterli kullanıcı terimini kaçırır', () => {
    expect(isitmeyiDuzelt('a.b geldi', 'a.b = A. B.').metin).toBe('A. B. geldi');
  });
});

describe('duzeltmeOzeti', () => {
  it('düzeltme yoksa boş döner', () => {
    expect(duzeltmeOzeti([])).toBe('');
  });

  it('toplamı ve örnekleri yazar', () => {
    const ozet = duzeltmeOzeti([{ yanlis: 'x', dogru: 'Buhârî', adet: 2 }]);
    expect(ozet).toContain('2 yazım düzeltildi');
    expect(ozet).toContain('Buhârî');
  });
});
