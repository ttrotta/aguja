import { DOC_SECTION_ORDER, type DocBlock, type DocContent } from "../content/types";

/**
 * Renders documentation from the ordered section list, not from the order keys
 * happen to appear in a content file — so the two locales cannot drift apart in
 * sequence (FR-069).
 *
 * Long-form reading layout: this page is prose, not a tool, and does not
 * inherit the split-pane density of the tool shell.
 */

function Block({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <p className="text-[1.0625rem] leading-relaxed text-text/85">{block.text}</p>;

    case "list":
      return (
        <ul className="flex flex-col gap-2 pl-5">
          {block.items.map((item) => (
            <li key={item} className="list-disc text-[1.0625rem] leading-relaxed text-text/85">
              {item}
            </li>
          ))}
        </ul>
      );

    case "callout":
      // Warning colouring is spent only on the failures this tool exists to
      // expose. A neutral aside gets the codebase's ordinary emphasis instead
      // — a violet top border — so the warning signal keeps its meaning.
      return block.tone === "warning" ? (
        <p className="flex items-start gap-2 rounded-sm border border-warning/50 bg-panel-inset-bg p-3 text-[0.9375rem] leading-relaxed text-text">
          <span aria-hidden="true" className="mt-0.5 shrink-0 text-warning">
            ▲
          </span>
          <span>{block.text}</span>
        </p>
      ) : (
        <p className="border-t-2 border-violet bg-panel-inset-bg p-3 text-[0.9375rem] leading-relaxed text-text/85">
          {block.text}
        </p>
      );

    case "example":
      return (
        <div className="border-t-2 border-violet bg-panel-inset-bg p-4">
          <p className="mb-3 text-sm text-text-muted">{block.caption}</p>
          <dl className="flex flex-col gap-2">
            {block.rows.map((row) => (
              <div key={row.label} className="grid grid-cols-1 gap-1 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-4">
                <dt className="text-sm font-medium text-text">{row.label}</dt>
                <dd className="text-sm leading-relaxed text-text/80">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      );

    case "steps":
      return (
        <ol className="flex flex-col gap-3">
          {block.items.map((step, index) => (
            <li key={step.tool + index} className="flex flex-col gap-1 border border-text/20 p-3">
              <span className="flex items-baseline gap-2">
                <span className="text-sm tabular-nums text-text-muted">{index + 1}</span>
                <span className="text-sm font-medium text-violet">{step.tool}</span>
              </span>
              <span className="text-[0.9375rem] leading-relaxed text-text/85">{step.check}</span>
            </li>
          ))}
        </ol>
      );
  }
}

export function DocSections({ content }: { content: DocContent }) {
  return (
    <div className="flex flex-col gap-14">
      {DOC_SECTION_ORDER.map((id) => {
        const section = content[id];
        return (
          <section key={id} id={id} className="flex flex-col gap-4 scroll-mt-24">
            <h2 className="font-display text-3xl font-black text-text">{section.title}</h2>
            {section.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

export function DocTableOfContents({ content }: { content: DocContent }) {
  return (
    <nav className="flex flex-col gap-2">
      {DOC_SECTION_ORDER.map((id) => (
        <a
          key={id}
          href={`#${id}`}
          className="text-sm leading-snug text-text-muted transition-colors hover:text-violet"
        >
          {content[id].title}
        </a>
      ))}
    </nav>
  );
}
