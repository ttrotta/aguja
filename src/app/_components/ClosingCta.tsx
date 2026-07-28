import Link from "next/link";

export function ClosingCta() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-28 text-center">
      <p className="font-display text-3xl font-black text-text md:text-4xl">
        Andá a ver dónde falla tu retrieval.
      </p>
      <Link
        href="/tool"
        className="mt-8 inline-block rounded-full bg-violet px-8 py-3.5 text-base font-medium text-page-bg transition-colors hover:bg-violet-deep"
      >
        Abrir el debugger
      </Link>
      <p className="mt-4 text-sm text-text-muted">Sin cuenta, sin login. Todo corre en tu navegador.</p>
    </section>
  );
}
