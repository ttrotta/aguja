const DOCUMENT_EXCERPT = `4.2 Refunds. Once a returned item passes inspection, refunds are issued to the
original payment method within 5-7 business days. Store credit is issued
immediately at the time of inspection, before the refund itself completes,
and can be used on any future order regardless of the original payment
method or the refund's processing status. International orders may require
an additional customs clearance period of up to 14 days before refund
processing begins, and delivery carriers outside the continental service
area are not covered by the standard refund window described above.`;

function Pin() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="mt-1 shrink-0">
      <circle cx="6" cy="6" r="5" fill="var(--color-violet)" />
    </svg>
  );
}

function Note({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-sm border border-text/10 bg-panel-bg p-3 text-sm text-text-muted shadow-lg shadow-black/30 ${className}`}
    >
      <Pin />
      <span>{children}</span>
    </div>
  );
}

export function ProblemEvidenceBoard() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-black text-text md:text-5xl">
          Los fallos de retrieval no avisan.
        </h2>
        <p className="mt-4 text-lg text-text-muted">
          El passage está en el documento. La búsqueda no lo trae. Y nada te dice por qué — hasta
          que ves el corte.
        </p>
      </div>

      <div className="relative mx-auto mt-20 max-w-6xl">
        <div className="hidden md:absolute md:top-4 md:left-4 md:block md:w-52">
          <Note className="-rotate-2">
            El corte cae acá, en medio de la frase — la mitad de &ldquo;regardless of the original
            payment method&rdquo; queda en el chunk siguiente.
          </Note>
        </div>

        <div className="hidden md:absolute md:top-44 md:right-4 md:block md:w-52">
          <Note className="rotate-1">
            Este chunk ya mide ~1.100 caracteres — el modelo lo trunca cerca de los 1.000 y la
            aclaración de aduana nunca se embeddea.
          </Note>
        </div>

        <div className="rounded-lg border border-text/10 bg-panel-inset-bg p-6 md:mx-auto md:max-w-xl md:p-8">
          <p className="mb-3 text-xs tracking-wide text-text-muted">
            documento de ejemplo (sintético) — política de reembolsos
          </p>
          <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-text/90">
            {DOCUMENT_EXCERPT}
          </p>
        </div>

        <div className="mt-6 flex justify-center md:mt-8">
          <Note className="rotate-2 md:w-72">
            Sin línea en blanco entre &ldquo;4.2 Refunds&rdquo; y &ldquo;4.3&rdquo; → &ldquo;por
            paragraphs&rdquo; colapsa las dos secciones en un solo chunk gigante.
          </Note>
        </div>
      </div>
    </section>
  );
}
