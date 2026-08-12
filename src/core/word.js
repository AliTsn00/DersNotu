// Notu Microsoft Word belgesine (.docx) çevirir.
//
// Arapça ibareler sağdan sola ve daha büyük punto ile yazılır; âyet/hadîs
// blokları kenar çizgili kutuya alınır.
//
// `docx` paketi büyük olduğu için ancak Word'e aktarım istendiğinde
// (dinamik import ile) indirilir; uygulamanın ilk açılışını yavaşlatmaz.

import { tarihYaz, sureYaz, maddeMetni, TUR_ETIKETLERI } from '../turkce/bicim.js';
import { DOGRULAMA_UYARISI, dogrulamaUyarisiGerekliMi, arapcaMi } from '../turkce/islami.js';

const ALINTI_TURLERI = new Set(['ayet', 'hadis', 'dua', 'arapca']);

const RENK = {
  govde: '18181B',
  soluk: '71717A',
  uyari: '92400E',
  alinti: '166534',
};

/** Yüklendikten sonra docx dışa aktarımlarını tutar. */
let D = null;

async function docxYukle() {
  if (!D) D = await import('docx');
  return D;
}

/** **kalın** işaretlerini TextRun dizisine çevirir. */
function metniParcala(metin, ortak = {}) {
  return String(metin)
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((parca) =>
      parca.startsWith('**') && parca.endsWith('**')
        ? new D.TextRun({ ...ortak, text: parca.slice(2, -2), bold: true })
        : new D.TextRun({ ...ortak, text: parca }),
    );
}

/** Arapça metin için sağdan sola paragraf. */
function arapcaParagraf(metin, girinti) {
  return new D.Paragraph({
    bidirectional: true,
    alignment: D.AlignmentType.RIGHT,
    indent: { left: girinti },
    spacing: { before: 60, after: 60 },
    children: [
      new D.TextRun({ text: metin, rightToLeft: true, size: 30, font: 'Traditional Arabic' }),
    ],
  });
}

function baslikParagrafi(metin, seviye, ustBosluk = 240) {
  return new D.Paragraph({
    heading: seviye,
    spacing: { before: ustBosluk, after: 120 },
    children: [new D.TextRun({ text: metin, bold: true })],
  });
}

/** Bir maddeyi (ve alt maddelerini) paragraf listesine çevirir. */
function maddeParagraflari(madde, derinlik = 0) {
  const girinti = 360 + derinlik * 360;
  const paragraflar = [];
  const etiket = TUR_ETIKETLERI[madde.tur];
  const numara = madde.numara ? `${madde.numara}  ` : '• ';

  if (ALINTI_TURLERI.has(madde.tur)) {
    const kunye = madde.kaynakKunyesi ? ` · ${madde.kaynakKunyesi}` : '';
    paragraflar.push(
      new D.Paragraph({
        indent: { left: girinti },
        spacing: { before: 120, after: 0 },
        border: {
          left: { style: D.BorderStyle.SINGLE, size: 12, space: 8, color: 'A7F3D0' },
        },
        children: [
          new D.TextRun({ text: `${numara}${etiket.ad}${kunye}`, bold: true, color: RENK.alinti }),
        ],
      }),
    );
    paragraflar.push(
      arapcaMi(madde.metin)
        ? arapcaParagraf(madde.metin, girinti)
        : new D.Paragraph({
            indent: { left: girinti },
            spacing: { after: 60 },
            children: [new D.TextRun({ text: madde.metin, italics: true, size: 24 })],
          }),
    );
  } else {
    // Markdown ile aynı metni kullan; baştaki simgeyi Word'de gösterme.
    const govde = maddeMetni(madde).replace(/^[^\p{L}\p{N}*]+/u, '');
    paragraflar.push(
      new D.Paragraph({
        indent: { left: girinti, hanging: 280 },
        spacing: { after: 80 },
        children: [
          new D.TextRun({ text: numara, bold: true, color: RENK.soluk }),
          ...metniParcala(govde),
        ],
      }),
    );
  }

  for (const alt of madde.alt || []) {
    paragraflar.push(...maddeParagraflari(alt, derinlik + 1));
  }
  return paragraflar;
}

function listeBolumu(baslik, satirlar) {
  if (!satirlar?.length) return [];
  return [
    baslikParagrafi(baslik, D.HeadingLevel.HEADING_2),
    ...satirlar.map(
      (satir) =>
        new D.Paragraph({
          indent: { left: 360, hanging: 200 },
          spacing: { after: 60 },
          children: [new D.TextRun({ text: '• ' }), ...metniParcala(satir)],
        }),
    ),
  ];
}

function alintiBolumu(baslik, kayitlar) {
  if (!kayitlar?.length) return [];
  const paragraflar = [baslikParagrafi(baslik, D.HeadingLevel.HEADING_2)];

  for (const kayit of kayitlar) {
    if (kayit.kunye) {
      paragraflar.push(
        new D.Paragraph({
          indent: { left: 360 },
          spacing: { before: 100, after: 0 },
          children: [new D.TextRun({ text: kayit.kunye, bold: true, color: RENK.alinti })],
        }),
      );
    }
    paragraflar.push(
      arapcaMi(kayit.metin)
        ? arapcaParagraf(kayit.metin, 360)
        : new D.Paragraph({
            indent: { left: 360 },
            spacing: { after: 40 },
            children: [new D.TextRun({ text: kayit.metin, italics: true })],
          }),
    );
    if (kayit.meal) {
      paragraflar.push(
        new D.Paragraph({
          indent: { left: 720 },
          spacing: { after: 60 },
          children: [
            new D.TextRun({ text: 'Meâli: ', bold: true, color: RENK.soluk }),
            new D.TextRun({ text: kayit.meal }),
          ],
        }),
      );
    }
  }
  return paragraflar;
}

/** Not nesnesinden bir docx Document kurar. */
export async function wordBelgesiKur(not) {
  await docxYukle();

  const ustBilgi = [
    tarihYaz(not.tarih),
    not.sure ? sureYaz(not.sure) : null,
    `${not.istatistik.kelime.toLocaleString('tr-TR')} kelime`,
    not.elleDuzenlendi ? 'elle düzenlendi' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const govde = [
    new D.Paragraph({
      heading: D.HeadingLevel.TITLE,
      spacing: { after: 80 },
      children: [new D.TextRun({ text: not.baslik, bold: true })],
    }),
    new D.Paragraph({
      spacing: { after: 240 },
      children: [new D.TextRun({ text: ustBilgi, color: RENK.soluk, size: 18 })],
    }),
  ];

  if (dogrulamaUyarisiGerekliMi(not)) {
    govde.push(
      new D.Paragraph({
        spacing: { after: 240 },
        border: { left: { style: D.BorderStyle.SINGLE, size: 12, space: 8, color: 'FCD34D' } },
        indent: { left: 200 },
        children: [new D.TextRun({ text: DOGRULAMA_UYARISI, color: RENK.uyari, size: 18 })],
      }),
    );
  }

  if (not.bolumler.length > 1) {
    govde.push(baslikParagrafi('İçindekiler', D.HeadingLevel.HEADING_2, 120));
    for (const bolum of not.bolumler) {
      govde.push(
        new D.Paragraph({
          indent: { left: 360 },
          spacing: { after: 40 },
          children: [new D.TextRun({ text: `${bolum.numara}. ${bolum.baslik}` })],
        }),
      );
    }
  }

  for (const bolum of not.bolumler) {
    govde.push(baslikParagrafi(`${bolum.numara}. ${bolum.baslik}`, D.HeadingLevel.HEADING_1));
    for (const grup of bolum.gruplar) {
      if (grup.baslik) govde.push(baslikParagrafi(grup.baslik, D.HeadingLevel.HEADING_3, 160));
      for (const madde of grup.maddeler) govde.push(...maddeParagraflari(madde));
    }
  }

  govde.push(
    ...listeBolumu(
      'Tanımlar',
      not.tanimlar.map(({ terim, aciklama }) => `**${terim}** — ${aciklama}`),
    ),
    ...alintiBolumu('Geçen Âyetler', not.ayetler),
    ...alintiBolumu('Geçen Hadîsler', not.hadisler),
    ...alintiBolumu('Duâlar', not.dualar),
    ...listeBolumu('Görüşler ve İhtilaflar', not.gorusler),
    ...listeBolumu('Sınavda Çıkabilir', not.onemliler),
    ...listeBolumu('Özet', not.ozet),
    ...listeBolumu('Cevaplanacak Sorular', not.sorular),
    ...listeBolumu(
      'Anahtar Kavramlar',
      not.anahtarlar.length ? [not.anahtarlar.map((a) => a.kelime).join(' · ')] : [],
    ),
  );

  return new D.Document({
    creator: 'Ders Notu',
    title: not.baslik,
    description: 'Ders sesinden otomatik çıkarılmış not',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: RENK.govde },
          paragraph: { spacing: { line: 300 } },
        },
      },
    },
    sections: [
      {
        properties: { page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
        children: govde,
      },
    ],
  });
}

/** Notu .docx olarak indirir. */
export async function wordIndir(not) {
  const belge = await wordBelgesiKur(not);
  const veri = await D.Packer.toBlob(belge);

  const ad = (not.baslik || 'ders-notu')
    .toLocaleLowerCase('tr')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const tarih = new Date(not.tarih).toISOString().slice(0, 10);

  const bag = URL.createObjectURL(veri);
  const baglanti = document.createElement('a');
  baglanti.href = bag;
  baglanti.download = `${tarih}-${ad || 'ders-notu'}.docx`;
  document.body.appendChild(baglanti);
  baglanti.click();
  baglanti.remove();
  setTimeout(() => URL.revokeObjectURL(bag), 1000);
}
