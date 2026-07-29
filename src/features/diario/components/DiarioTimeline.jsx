import { formatDiarioTime } from "../timeline/diarioTimeline";

export default function DiarioTimeline({ groups = [], onOpenAttachment }) {
  if (groups.length === 0) {
    return (
      <div className="ds-empty rounded-[18px] border border-white/10 bg-black/[0.16] p-6 text-center">
        <p className="font-black">Nessun evento</p>
        <p className="ds-text-secondary mt-1">
          Non ci sono eventi che corrispondono ai filtri selezionati.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.key}>
          <div className="sticky top-16 z-10 mb-3 inline-flex rounded-full bg-slate-900/90 px-3 py-1 text-sm font-black text-emerald-200 backdrop-blur">
            {group.label}
          </div>
          <ol className="space-y-3">
            {group.events.map((evento) => (
              <li
                key={evento.id}
                className="rounded-[18px] border border-white/10 bg-black/[0.16] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 shrink-0">
                    <p className="text-sm font-black text-yellow-200">
                      {formatDiarioTime(evento.timestamp)}
                    </p>
                  </div>
                  <div className="w-8 shrink-0 text-xl leading-none pt-0.5">
                    {evento.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black">{evento.title}</h4>
                    {evento.description ? (
                      <p className="text-sm text-slate-300 mt-1 whitespace-pre-line">
                        {evento.description}
                      </p>
                    ) : null}

                    {evento.attachments?.length > 0 ? (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {evento.attachments.map((attachment) => (
                          <button
                            key={attachment.id || attachment.src}
                            type="button"
                            onClick={() => onOpenAttachment?.(attachment)}
                            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[14px] border border-white/10 bg-black/30"
                            aria-label={`Apri allegato ${attachment.alt || evento.title}`}
                          >
                            <img
                              src={attachment.thumbnail || attachment.src}
                              alt={attachment.alt || evento.title}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
