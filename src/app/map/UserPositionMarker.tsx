export function UserPositionMarker({ heading = 0 }: { heading?: number }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-sky-400/25 blur-md" />
      <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-900/70 ring-2 ring-sky-300/70 shadow-[0_0_0_10px_rgba(56,189,248,0.18)]">
        <div
          className="grid h-6 w-6 place-items-center"
          style={{ transform: `rotate(${heading}deg)` }}
          aria-label="Your direction"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3 20 20 12 16 4 20 12 3Z" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1.2" />
            <circle cx="12" cy="16.2" r="1.6" fill="#e0f2fe" />
          </svg>
        </div>
      </div>
    </div>
  );
}
