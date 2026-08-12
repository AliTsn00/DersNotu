// Ders boyunca ekranın kapanmasını engeller (Screen Wake Lock API).

let kilit = null;

export const ekranKilidiVarMi = () =>
  typeof navigator !== 'undefined' && 'wakeLock' in navigator;

export async function ekraniAcikTut() {
  if (!ekranKilidiVarMi() || kilit) return false;
  try {
    kilit = await navigator.wakeLock.request('screen');
    kilit.addEventListener('release', () => {
      kilit = null;
    });
    return true;
  } catch {
    return false;
  }
}

export async function ekranKilidiniBirak() {
  try {
    await kilit?.release();
  } catch {
    // yoksay
  }
  kilit = null;
}

/** Sekme geri geldiğinde kilit düşmüşse yeniden alır. */
export function ekranKilidiniIzle(istenirMi) {
  const isle = () => {
    if (document.visibilityState === 'visible' && istenirMi()) ekraniAcikTut();
  };
  document.addEventListener('visibilitychange', isle);
  return () => document.removeEventListener('visibilitychange', isle);
}
