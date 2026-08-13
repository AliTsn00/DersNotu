import { afterEach, describe, expect, it } from 'vitest';

import { mikrofonuDene, seviyeYorumu } from '../src/core/seviye.js';

describe('mikrofonuDene', () => {
  // navigator salt okunur bir özellik; doğrudan atama yapılamıyor.
  const eskisi = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const kur = (getUserMedia) => {
    Object.defineProperty(globalThis, 'navigator', {
      value: getUserMedia ? { mediaDevices: { getUserMedia } } : {},
      configurable: true,
      writable: true,
    });
  };
  afterEach(() => {
    if (eskisi) Object.defineProperty(globalThis, 'navigator', eskisi);
  });

  it('erişim varsa açtığı akışı kapatır', async () => {
    let durduruldu = false;
    kur(async () => ({ getTracks: () => [{ stop: () => { durduruldu = true; } }] }));
    expect(await mikrofonuDene()).toEqual({ tamam: true });
    // Akış açık kalırsa kaydın kendisi mikrofonu meşgul bulur.
    expect(durduruldu).toBe(true);
  });

  it('izin reddini ayarlara yönlendiren mesaja çevirir', async () => {
    kur(async () => {
      throw Object.assign(new Error('yok'), { name: 'NotAllowedError' });
    });
    const sonuc = await mikrofonuDene();
    expect(sonuc.tamam).toBe(false);
    expect(sonuc.mesaj).toMatch(/İzin ver/);
  });

  it('mikrofonun başka uygulamada olduğunu ayırt eder', async () => {
    kur(async () => {
      throw Object.assign(new Error('meşgul'), { name: 'NotReadableError' });
    });
    expect((await mikrofonuDene()).mesaj).toMatch(/başka bir uygulamada/);
  });

  it('cihaz yokluğunu ayırt eder', async () => {
    kur(async () => {
      throw Object.assign(new Error('yok'), { name: 'NotFoundError' });
    });
    expect((await mikrofonuDene()).mesaj).toMatch(/bulunamadı/);
  });

  it('tanınmayan hatayı adıyla bildirir', async () => {
    kur(async () => {
      throw Object.assign(new Error('?'), { name: 'TuhafHata' });
    });
    expect((await mikrofonuDene()).mesaj).toMatch(/TuhafHata/);
  });

  it('desteklemeyen tarayıcıyı bildirir', async () => {
    kur(null);
    expect((await mikrofonuDene()).tamam).toBe(false);
  });
});

describe('seviyeYorumu', () => {
  it('sessizliği ses gelmiyor sayar', () => {
    expect(seviyeYorumu(0).durum).toBe('yok');
  });

  it('düşük düzeyde yaklaşmayı önerir', () => {
    const yorum = seviyeYorumu(0.03);
    expect(yorum.durum).toBe('zayif');
    expect(yorum.mesaj).toMatch(/yaklaştırın/);
  });

  it('normal düzeyi onaylar', () => {
    expect(seviyeYorumu(0.3).durum).toBe('iyi');
  });

  it('kırpılma sınırında uyarır', () => {
    expect(seviyeYorumu(0.95).durum).toBe('yuksek');
  });
});
