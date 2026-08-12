// Notu panoya kopyalama, dosya olarak indirme ve PDF için yazdırma.

import { markdownYaz, duzMetinYaz, tarihYaz } from '../turkce/bicim.js';

function dosyaAdiUret(not, uzanti) {
  const ad = (not.baslik || 'ders-notu')
    .toLocaleLowerCase('tr')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const tarih = new Date(not.tarih).toISOString().slice(0, 10);
  return `${tarih}-${ad || 'ders-notu'}.${uzanti}`;
}

export function dosyaIndir(icerik, dosyaAdi, tip = 'text/plain;charset=utf-8') {
  const bag = URL.createObjectURL(new Blob([icerik], { type: tip }));
  const baglanti = document.createElement('a');
  baglanti.href = bag;
  baglanti.download = dosyaAdi;
  document.body.appendChild(baglanti);
  baglanti.click();
  baglanti.remove();
  setTimeout(() => URL.revokeObjectURL(bag), 1000);
}

export const markdownIndir = (not) =>
  dosyaIndir(markdownYaz(not), dosyaAdiUret(not, 'md'), 'text/markdown;charset=utf-8');

export const metinIndir = (not) => dosyaIndir(duzMetinYaz(not), dosyaAdiUret(not, 'txt'));

export async function panoyaKopyala(metin) {
  try {
    await navigator.clipboard.writeText(metin);
    return true;
  } catch {
    // clipboard API yoksa (http, eski tarayıcı) geçici alan kullan
    const alan = document.createElement('textarea');
    alan.value = metin;
    alan.setAttribute('readonly', '');
    alan.style.position = 'fixed';
    alan.style.opacity = '0';
    document.body.appendChild(alan);
    alan.select();
    const oldu = document.execCommand?.('copy') ?? false;
    alan.remove();
    return oldu;
  }
}

/** Notu ayrı bir pencerede yazdırır — tarayıcının "PDF olarak kaydet" seçeneği kullanılır. */
export function pdfOlarakYazdir(not) {
  const govde = markdownYaz(not)
    .split('\n')
    .map((satir) => {
      const kacir = (m) =>
        m
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      const zengin = (m) =>
        kacir(m)
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/`(.+?)`/g, '<code>$1</code>');

      if (satir.startsWith('### ')) return `<h3>${zengin(satir.slice(4))}</h3>`;
      if (satir.startsWith('## ')) return `<h2>${zengin(satir.slice(3))}</h2>`;
      if (satir.startsWith('# ')) return `<h1>${zengin(satir.slice(2))}</h1>`;
      if (satir.startsWith('> ')) return `<p class="uyari">${zengin(satir.slice(2))}</p>`;
      if (/^\s*\d+\.\s/.test(satir)) {
        return `<div class="madde alt">${zengin(satir.trim())}</div>`;
      }
      if (/^\s*-\s/.test(satir)) {
        const alt = /^\s{2,}/.test(satir);
        return `<div class="madde${alt ? ' alt' : ''}">• ${zengin(satir.trim().slice(2))}</div>`;
      }
      if (satir.startsWith('_') && satir.endsWith('_')) {
        return `<p class="ustbilgi">${zengin(satir.slice(1, -1))}</p>`;
      }
      return satir.trim() ? `<p>${zengin(satir)}</p>` : '';
    })
    .join('\n');

  const pencere = window.open('', '_blank');
  if (!pencere) return false;
  pencere.document.write(`<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>${not.baslik}</title>
<style>
  @page { margin: 18mm; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #18181b; line-height: 1.55; }
  h1 { font-size: 22pt; margin: 0 0 4px; }
  h2 { font-size: 14pt; margin: 22px 0 8px; border-bottom: 1px solid #e4e4e7; padding-bottom: 4px; }
  h3 { font-size: 11pt; margin: 14px 0 6px; color: #52525b; text-transform: uppercase; letter-spacing: .04em; }
  .uyari { border-left: 3px solid #f59e0b; background: #fffbeb; padding: 6px 10px; color: #92400e; font-size: 9.5pt; }
  [dir="rtl"], .arapca { direction: rtl; text-align: right; font-size: 15pt; line-height: 2;
    font-family: "Traditional Arabic", "Amiri", "Scheherazade New", serif; }
  .ustbilgi { color: #71717a; font-size: 10pt; margin: 0 0 18px; }
  .madde { margin: 4px 0; }
  .madde.alt { margin-left: 22px; color: #3f3f46; }
  code { background: #f4f4f5; padding: 1px 5px; border-radius: 4px; font-size: 10pt; }
  strong { color: #000; }
</style></head>
<body>${govde}
<p class="ustbilgi">Ders Notu · ${tarihYaz(not.tarih)}</p>
<script>window.onload = () => { window.print(); }<\/script>
</body></html>`);
  pencere.document.close();
  return true;
}
