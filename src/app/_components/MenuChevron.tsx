/**
 * The disclosure mark on every navbar dropdown trigger. Drawn rather than typed
 * so it carries real weight next to the label, and flipped while the menu is
 * open so the trigger says which way it goes.
 */
export function MenuChevron({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={[
        "shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none",
        isOpen ? "-rotate-180" : "",
      ].join(" ")}
    >
      <path
        d="M3 4.75 6 7.75l3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
