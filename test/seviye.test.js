import { describe, expect, it } from 'vitest';

import { seviyeYorumu } from '../src/core/seviye.js';

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
