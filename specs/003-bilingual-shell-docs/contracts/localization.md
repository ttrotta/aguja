# Contract: `localization/domain`

Pure functions over plain strings. No framework import, no `window`, no router — Principle III
applies here exactly as it does to chunking and similarity, which is what lets these be tested with
plain assertions and no render harness.

The `e2e` suite consumes the same functions, so the twelve hardcoded paths in `chunking.spec.ts`,
`retrieval.spec.ts`, and `no-network-leak.spec.ts` collapse to one source of truth
(research.md Finding 4).

## `SUPPORTED_LOCALES` / `DEFAULT_LOCALE`

```ts
type Locale = "en" | "es";
const SUPPORTED_LOCALES: readonly Locale[];
const DEFAULT_LOCALE: Locale; // "en"
```

The union is the only place support is declared. Adding a third locale means changing this union
and being told by the compiler everywhere else that needs attention.

## `isSupportedLocale`

```ts
function isSupportedLocale(value: string): value is Locale;
```

**Postconditions**

- Returns `true` only for a member of `SUPPORTED_LOCALES`.
- Case-sensitive: `"EN"` is not supported. Address casing is not normalised here, because silently
  accepting a variant spelling would produce two addresses for one page.
- Never throws. Any string is valid input; that is the point of a guard.

## `localizedPath`

```ts
function localizedPath(path: string, locale: Locale): string;
```

Builds the address of an unlocalised application path in a given locale.

**Preconditions**

- `path` begins with `/` and carries no locale segment.

**Postconditions**

- `localizedPath("/tool/chunks", "es")` is `"/es/tool/chunks"`.
- `localizedPath("/", "en")` is `"/en"` — not `"/en/"`. One address per page, no trailing-slash
  variants.
- Pure: same inputs, same output, no reliance on ambient state.

## `swapLocale`

```ts
function swapLocale(path: string, target: Locale): string;
```

Takes an address that already carries a locale and returns the same page in another one. This is
what the language switcher calls, and it is why FR-055 can promise the equivalent page rather than
a generic entry point.

**Postconditions**

- `swapLocale("/es/tool/confusable", "en")` is `"/en/tool/confusable"`.
- The path after the locale segment is preserved exactly, including nested segments.
- Query strings and fragments, if present, are preserved.
- If the path carries no recognised locale segment, the target locale is prefixed rather than a
  segment being replaced — so a stray unlocalised address heals instead of corrupting.

## `stripLocale`

```ts
function stripLocale(path: string): { locale: Locale | null; path: string };
```

Splits an address into its locale and the rest. Used by the switcher and by any check that needs to
compare two addresses as the same page in different languages.

**Postconditions**

- `stripLocale("/es/tool/chunks")` is `{ locale: "es", path: "/tool/chunks" }`.
- `stripLocale("/tool/chunks")` is `{ locale: null, path: "/tool/chunks" }` — an unlocalised
  address is reported honestly, not defaulted, so the caller decides what to do about it.
- `stripLocale("/es")` is `{ locale: "es", path: "/" }`.
- A first segment that merely looks like a locale but is not supported (`/fr/tool`) yields
  `{ locale: null, path: "/fr/tool" }`. Guessing would produce a half-translated page, which
  FR-058 forbids.

## Test obligations

Written and observed failing before implementation (Principle II). Exact strings asserted; there is
no nondeterminism here to justify a tolerance.

| Case | Expectation |
|---|---|
| `isSupportedLocale` over each supported code | `true` |
| `isSupportedLocale("fr")`, `("")`, `("EN")` | `false` |
| `localizedPath` on a nested path | Exact string, locale prefixed |
| `localizedPath` on `"/"` | `"/en"`, no trailing slash |
| `swapLocale` between the two locales | Exact string, remainder preserved |
| `swapLocale` preserving a query string and fragment | Both preserved |
| `swapLocale` on an unlocalised path | Locale prefixed, nothing replaced |
| `stripLocale` on a localised path | Locale and remainder split exactly |
| `stripLocale` on an unlocalised path | `locale: null`, path unchanged |
| `stripLocale` on a locale-only path | `path: "/"` |
| `stripLocale` on an unsupported first segment | `locale: null`, path unchanged |
| Round trip: `swapLocale(localizedPath(p, "en"), "es")` | Equals `localizedPath(p, "es")` |

## Message catalogue parity

Not a function — a test, and the only thing enforcing FR-059 (research.md Finding 2).

| Case | Expectation |
|---|---|
| Key sets of both catalogues | Identical |
| A key in English missing from Spanish | Test fails, naming the key |
| A key in Spanish missing from English | Test fails, naming the key |

Typed keys catch a reference to a key that exists in no catalogue. They do not catch a key missing
from one of them, because the types are generated from a single catalogue. This test is the other
half.

## Documentation parity

Enforced by the type system rather than a test (research.md Finding 3): each locale exports
`Record<DocSectionId, DocSection>`, so a missing section fails to compile. The ordered list of
section ids is exported once and shared, so order cannot diverge either.

The one thing types cannot check is whether the Spanish text actually says what the English text
says. That stays a human review obligation and is called out in
[quickstart.md](../quickstart.md).
