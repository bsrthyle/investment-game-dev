import { useEffect, useRef, useState } from 'react';

export default function InfoPopover({ title, children, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={ariaLabel || `More info: ${title}`}
        aria-expanded={open}
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-ink/25 text-[11px] font-bold leading-none text-ink/60 hover:bg-ink/5 hover:text-ink focus:outline-none focus:ring-2 focus:ring-action-green"
      >
        i
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={title}
          className="absolute left-0 top-7 z-40 w-72 rounded-lg border border-ink/10 bg-white p-3 text-left text-body shadow-lg"
        >
          <div className="mb-1 text-sm font-semibold text-ink">{title}</div>
          <div className="text-xs leading-relaxed text-ink/75 normal-case tracking-normal">
            {children}
          </div>
        </div>
      )}
    </span>
  );
}
