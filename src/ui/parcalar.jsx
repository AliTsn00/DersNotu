// Uygulama genelinde kullanılan küçük arayüz parçaları.

export function Dugme({ cesit = 'sade', boyut = 'orta', className = '', ...ozellikler }) {
  const cesitler = {
    ana: 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-sm',
    sade: 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
    hayalet:
      'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
    tehlike:
      'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40',
  };
  const boyutlar = {
    kucuk: 'px-2.5 py-1.5 text-xs gap-1',
    orta: 'px-3.5 py-2 text-sm gap-1.5',
    buyuk: 'px-5 py-3 text-base gap-2',
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-xl font-medium
        transition-colors disabled:cursor-not-allowed disabled:opacity-45
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500
        ${cesitler[cesit]} ${boyutlar[boyut]} ${className}`}
      {...ozellikler}
    />
  );
}

export function Kart({ className = '', ...ozellikler }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-4
        dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
      {...ozellikler}
    />
  );
}

export function Etiket({ children, renk = 'zinc' }) {
  const renkler = {
    zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${renkler[renk]}`}>
      {children}
    </span>
  );
}

export function BosDurum({ baslik, aciklama, children }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <p className="text-base font-medium text-zinc-700 dark:text-zinc-200">{baslik}</p>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{aciklama}</p>
      {children}
    </div>
  );
}

export function Alan({ etiket, aciklama, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{etiket}</span>
      {children}
      {aciklama ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{aciklama}</span>
      ) : null}
    </label>
  );
}

export const girdiSinifi =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none ' +
  'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';
