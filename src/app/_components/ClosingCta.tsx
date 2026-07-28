import Link from "next/link";

export function ClosingCta() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-28 text-center">
      <p className="font-display text-3xl font-black text-text md:text-4xl">
        Go see where your retrieval fails.
      </p>
      <Link
        href="/tool"
        className="mt-8 inline-block rounded-full bg-violet px-8 py-3.5 text-base font-medium text-page-bg transition-colors hover:bg-violet-deep"
      >
        Open the debugger
      </Link>
      <p className="mt-4 text-sm text-text-muted">No account, no login. Everything runs in your browser.</p>
    </section>
  );
}
