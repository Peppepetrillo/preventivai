/**
 * Riga timeline: ora + glifo stato + contenuto.
 */
export default function TimelineItem({
  ora = "",
  statoGlifo = "○",
  statoLabel = "",
  isLast = false,
  children,
}) {
  return (
    <li className="relative pl-14 pb-5 last:pb-0">
      {!isLast ? (
        <span
          className="absolute left-[22px] top-8 bottom-0 w-px"
          style={{ background: "var(--line-strong)" }}
          aria-hidden="true"
        />
      ) : null}
      <div className="absolute left-0 top-3 w-11 flex flex-col items-center gap-0.5">
        <span
          className="text-[11px] font-bold tabular-nums leading-none"
          style={{ color: "var(--primary-soft)" }}
          aria-hidden="true"
        >
          {ora ? String(ora).slice(0, 5) : "—"}
        </span>
        <span
          className="text-sm leading-none mt-1 ds-text-secondary"
          title={statoLabel}
          aria-label={statoLabel}
        >
          {statoGlifo}
        </span>
      </div>
      <div>{children}</div>
    </li>
  );
}
