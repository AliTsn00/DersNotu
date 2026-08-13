import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { arapHarfiVarMi, arapcayiNormalle, dizinKur } from '../src/kuran/dogrula.js';

const veri = JSON.parse(readFileSync(resolve('public/kuran.json'), 'utf8'));
const kuran = dizinKur(veri);

describe('arapcayiNormalle', () => {
  it('hareke ve durak işaretlerini atar', () => {
    expect(arapcayiNormalle('بِسْمِ')).toBe('بسم');
  });

  it('elif varyantlarını tek biçime indirger', () => {
    expect(arapcayiNormalle('ٱلْحَمْدُ')).toBe(arapcayiNormalle('الحمد'));
    expect(arapcayiNormalle('أَنَّ')).toBe(arapcayiNormalle('ان'));
  });

  it('Arapça olmayan işaretleri temizler', () => {
    expect(arapcayiNormalle('«الله» (1)')).toBe('الله');
  });
});

describe('arapHarfiVarMi', () => {
  it('Latin harfli çevriyazıyı Arapça saymaz', () => {
    expect(arapHarfiVarMi('Bismillahirrahmanirrahim')).toBe(false);
  });

  it('Arap harfini tanır', () => {
    expect(arapHarfiVarMi('الله')).toBe(true);
  });
});

describe('Kur\'ân verisi', () => {
  it('6236 âyet ve 114 sûre içerir', () => {
    expect(kuran.ayetSayisi).toBe(6236);
    expect(veri.sureBasi).toHaveLength(114);
  });
});

describe('ayetiBul', () => {
  it('Bakara 153\'ü künyesiyle bulur', () => {
    const sonuc = kuran.ayetiBul('يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ');
    expect(sonuc.durum).toBe('kesin');
    expect(sonuc.kunye).toBe('Bakara 153');
  });

  it('besmeleyi Fâtiha 1 olarak bulur', () => {
    const sonuc = kuran.ayetiBul('بسم الله الرحمن الرحيم');
    expect(sonuc.durum).toBe('kesin');
    expect(sonuc.sure).toBe(1);
    expect(sonuc.ayet).toBe(1);
  });

  it('harekesiz yazılmış âyeti de bulur', () => {
    const sonuc = kuran.ayetiBul('ان الله مع الصابرين');
    expect(sonuc.durum).toBe('kesin');
    expect(sonuc.kunye).toBe('Bakara 153');
  });

  it('son sûrenin âyetini doğru numaralar', () => {
    const sonuc = kuran.ayetiBul('من شر الوسواس الخناس');
    expect(sonuc.durum).toBe('kesin');
    expect(sonuc.kunye).toBe('Nâs 4');
  });

  it('Kur\'ân\'da olmayan Arapça ibareyi bulunamadı sayar', () => {
    // Sahih bir hadîs metni — Kur\'ân değildir, künye uydurulmamalı.
    expect(kuran.ayetiBul('انما الاعمال بالنيات وانما لكل امرئ ما نوى').durum).toBe('yok');
  });

  it('Latin harfli çevriyazıyı okunamadı olarak işaretler', () => {
    expect(kuran.ayetiBul('Innallahe meassabirin').durum).toBe('okunamadi');
  });

  it('tek kelimelik ibareye künye vermez', () => {
    expect(kuran.ayetiBul('الله').durum).toBe('yok');
  });

  it('bir kelimesi bozulmuş âyeti olası eşleşme olarak bildirir', () => {
    // Konuşma tanıma "الصلاة" yerine başka bir kelime duymuş gibi.
    const sonuc = kuran.ayetiBul('يا ايها الذين امنوا استعينوا بالصبر والكتاب');
    expect(sonuc.durum).toBe('olasi');
    expect(sonuc.kunye).toBe('Bakara 153');
    expect(sonuc.benzerlik).toBeGreaterThanOrEqual(0.75);
  });
});
