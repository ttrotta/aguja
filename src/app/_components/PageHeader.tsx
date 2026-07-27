export function PageHeader() {
  return (
    <header>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Aguja</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Paste a document, see how it gets chunked, then find out which chunks a query actually
        retrieves.
      </p>
    </header>
  );
}
