"use client";

type CompareModeToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function CompareModeToggle({ checked, onChange }: CompareModeToggleProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      Compare two strategies
    </label>
  );
}
