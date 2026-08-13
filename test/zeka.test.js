import { describe, expect, it } from 'vitest';

import { ciktiyiAl, jsonAyikla, jsonKurtarmaAdaylari, yerTutucuNotu } from '../src/core/zeka.js';
import { uydurmalariAyikla } from '../src/turkce/llm.js';

describe('yerTutucuNotu', () => {
  it('parçadaki yer tutucuları sayar', () => {
    const not = yerTutucuNotu([
      { metin: 'Hoca ⟦AR:3⟧ âyetini okudu.' },
      { metin: 'Sonra ⟦AR:4⟧ dedi.' },
    ]);
    expect(not).toContain('⟦AR:3⟧, ⟦AR:4⟧');
    expect(not).toContain('Başka bir yer tutucu yazma');
  });

  it('yer tutucu yoksa açıkça yasaklar', () => {
    const not = yerTutucuNotu([{ metin: 'Sabır güzeldir.' }]);
    expect(not).toContain('hiç Arapça yer tutucu yok');
  });
});

describe('uydurmalariAyikla', () => {
  const notKur = (maddeler) => ({
    baslik: 'Ders',
    bolumler: [{ id: 'b0', baslik: 'Giriş', gruplar: [{ id: 'b0-g0', maddeler }] }],
    ozet: [],
    sorular: [],
  });

  it('tanımsız yer tutucu taşıyan maddeyi düşürür', () => {
    const not = notKur([
      { id: 'c1', metin: 'Sabır güzeldir.' },
      { id: 'c4', metin: '⟦AR:9⟧' },
    ]);
    const silinen = uydurmalariAyikla(not, { 'AR:0': 'x' });
    expect(silinen).toBe(1);
    expect(not.bolumler[0].gruplar[0].maddeler).toHaveLength(1);
  });

  it('tanımlı yer tutucuya dokunmaz', () => {
    const not = notKur([{ id: 'c4', metin: '⟦AR:0⟧' }]);
    expect(uydurmalariAyikla(not, { 'AR:0': 'x' })).toBe(0);
    expect(not.bolumler[0].gruplar[0].maddeler).toHaveLength(1);
  });

  it('maddeleri tükenen bölümü kaldırır', () => {
    const not = notKur([{ id: 'c4', metin: '⟦AR:9⟧' }]);
    uydurmalariAyikla(not, {});
    expect(not.bolumler).toHaveLength(0);
  });

  it('alt maddedeki uydurmayı temizler ama maddeyi korur', () => {
    const not = notKur([
      { id: 'c1', metin: 'Sabır güzeldir.', alt: [{ metin: 'Doğru' }, { metin: '⟦AR:9⟧' }] },
    ]);
    expect(uydurmalariAyikla(not, {})).toBe(0);
    expect(not.bolumler[0].gruplar[0].maddeler[0].alt).toHaveLength(1);
  });
});

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
