import { describe, expect, it } from 'vitest';

import { ciktiyiAl, jsonAyikla, jsonKurtarmaAdaylari } from '../src/core/zeka.js';

describe('ciktiyiAl', () => {
  it('response alanındaki metni alır', () => {
    expect(ciktiyiAl({ response: '{"a":1}' })).toBe('{"a":1}');
  });

  it('response nesne ise metne çevirmeden aktarır', () => {
    // String(...) uygulanırsa "[object Object]" olur ve yanıt kaybolur.
    const nesne = { bolumler: [] };
    expect(ciktiyiAl({ response: nesne })).toBe(nesne);
  });

  it('OpenAI biçimindeki yanıtı okur', () => {
    const sonuc = { choices: [{ message: { content: '{"a":1}' } }] };
    expect(ciktiyiAl(sonuc)).toBe('{"a":1}');
  });

  it('gpt-oss biçimindeki output dizisini birleştirir', () => {
    const sonuc = { output: [{ content: [{ text: 'bir' }, { text: 'iki' }] }] };
    expect(ciktiyiAl(sonuc)).toBe('bir\niki');
  });

  it('boş yanıtta boş dizgi döner', () => {
    expect(ciktiyiAl(null)).toBe('');
  });
});

describe('jsonAyikla', () => {
  it('düz JSON okur', () => {
    expect(jsonAyikla('{"baslik":"Ders"}')).toEqual({ baslik: 'Ders' });
  });

  it('kod bloğuna sarılmış yanıtı okur', () => {
    const ham = '```json\n{"baslik":"Ders"}\n```';
    expect(jsonAyikla(ham)).toEqual({ baslik: 'Ders' });
  });

  it('baştaki açıklama cümlesini atar', () => {
    const ham = 'İşte ders notunuz:\n{"baslik":"Ders"}';
    expect(jsonAyikla(ham)).toEqual({ baslik: 'Ders' });
  });

  it('dizgi ortasında kesilmiş yanıtı kurtarır', () => {
    // Model yanıt sınırına takıldığında çıktı böyle biter.
    const ham = '{"baslik":"Ders","bolumler":[{"baslik":"Giriş","maddeler":[{"metin":"Yarım cüm';
    const sonuc = jsonAyikla(ham);
    expect(sonuc.baslik).toBe('Ders');
    expect(sonuc.bolumler[0].baslik).toBe('Giriş');
  });

  it('madde arasında kesilmiş yanıtı kurtarır', () => {
    const ham =
      '{"baslik":"Ders","bolumler":[{"baslik":"Giriş","maddeler":[{"metin":"Tam cümle."},';
    const sonuc = jsonAyikla(ham);
    expect(sonuc.bolumler[0].maddeler[0].metin).toBe('Tam cümle.');
  });

  it('kaçışlı tırnak dizgiyi erken kapatmaz', () => {
    const ham = '{"metin":"Hoca \\"dikkat\\" dedi."}';
    expect(jsonAyikla(ham).metin).toBe('Hoca "dikkat" dedi.');
  });

  it('JSON olmayan yanıtta yanıtın başını hataya koyar', () => {
    expect(() => jsonAyikla('Üzgünüm, bu isteği yerine getiremem.')).toThrow(
      /Üzgünüm, bu isteği/,
    );
  });

  it('boş yanıtı ayırt eder', () => {
    expect(() => jsonAyikla('')).toThrow(/boş yanıt/);
  });

  it('çözülmüş nesneyi olduğu gibi kabul eder', () => {
    const nesne = { baslik: 'Ders', bolumler: [] };
    expect(jsonAyikla(nesne)).toBe(nesne);
  });

  it('beklenen alanları taşımayan nesnede yapıyı hataya koyar', () => {
    expect(() => jsonAyikla({ usage: { tokens: 12 } })).toThrow(/usage/);
  });
});

describe('jsonKurtarmaAdaylari', () => {
  it('açık kalan dizi ve nesneleri kapatır', () => {
    const adaylar = jsonKurtarmaAdaylari('{"a":[{"b":1');
    expect(adaylar).toContain('{"a":[{"b":1}]}');
  });

  it('kesilmiş dizgi için önce dizgiyi kapatan adayı üretir', () => {
    const adaylar = jsonKurtarmaAdaylari('{"a":"yarım');
    expect(adaylar[0]).toBe('{"a":"yarım"}');
  });
});
