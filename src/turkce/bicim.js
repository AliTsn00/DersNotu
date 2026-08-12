// Not nesnesini dışa aktarım biçimlerine çevirir (Markdown / düz metin).

const AY_BICIMI = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function tarihYaz(isoTarih) {
  const tarih = new Date(isoTarih);
  if (Number.isNaN(tarih.getTime())) return '';
  return AY_BICIMI.format(tarih);
}

export function sureYaz(saniye = 0) {
  const toplam = Math.max(0, Math.round(saniye));
  const dakika = Math.floor(toplam / 60);
  if (dakika < 1) return `${toplam} sn`;
  const saat = Math.floor(dakika / 60);
  if (saat < 1) return `${dakika} dk`;
  return `${saat} sa ${dakika % 60} dk`;
}

function ustBilgi(not) {
  const parcalar = [tarihYaz(not.tarih)];
  if (not.sure) parcalar.push(sureYaz(not.sure));
  if (not.istatistik?.kelime) {
    parcalar.push(`${not.istatistik.kelime.toLocaleString('tr-TR')} kelime`);
  }
  if (not.istatistik?.madde) parcalar.push(`${not.istatistik.madde} madde`);
  return parcalar.filter(Boolean).join(' · ');
}

function maddeYaz(madde, girinti = '') {
  const satirlar = [];
  const onek = madde.tur === 'onemli' ? '⚠️ **Önemli:** ' : '';
  satirlar.push(`${girinti}- ${onek}${madde.metin}`);

  const listeMi = madde.tur === 'listeBasi';
  madde.alt?.forEach((alt, sira) => {
    const isaret = listeMi && alt.tur === 'madde' ? `${sira + 1}.` : '-';
    satirlar.push(`${girinti}  ${isaret} ${alt.metin}`);
  });

  return satirlar;
}

export function markdownYaz(not) {
  const satirlar = [`# ${not.baslik}`, '', `_${ustBilgi(not)}_`, ''];

  not.bolumler.forEach((bolum, sira) => {
    satirlar.push(`## ${sira + 1}. ${bolum.baslik}`, '');
    for (const madde of bolum.maddeler) satirlar.push(...maddeYaz(madde));
    satirlar.push('');
  });

  if (not.tanimlar.length) {
    satirlar.push('## Tanımlar', '');
    for (const { terim, aciklama } of not.tanimlar) {
      satirlar.push(`- **${terim}** — ${aciklama.replace(/[.?!]$/, '')}.`);
    }
    satirlar.push('');
  }

  if (not.onemliler.length) {
    satirlar.push('## Sınavda Çıkabilir', '');
    for (const metin of not.onemliler) satirlar.push(`- ${metin}`);
    satirlar.push('');
  }

  if (not.ozet.length) {
    satirlar.push('## Özet', '');
    for (const metin of not.ozet) satirlar.push(`- ${metin}`);
    satirlar.push('');
  }

  if (not.sorular.length) {
    satirlar.push('## Cevaplanacak Sorular', '');
    for (const metin of not.sorular) satirlar.push(`- [ ] ${metin}`);
    satirlar.push('');
  }

  if (not.anahtarlar.length) {
    satirlar.push('## Anahtar Kavramlar', '');
    satirlar.push(not.anahtarlar.map((a) => `\`${a.kelime}\``).join(' '));
    satirlar.push('');
  }

  return satirlar.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export function duzMetinYaz(not) {
  return markdownYaz(not)
    .replace(/^#{1,6} /gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^- \[ \] /gm, '□ ')
    .replace(/^(\s*)- /gm, '$1• ');
}
