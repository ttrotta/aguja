import { describe, expect, it } from "vitest";
import { chunk } from "./index";
import type { NonTokenStrategy } from "./strategy";

function randomText(length: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ\n\n.,!?";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

const NON_OVERLAP_STRATEGIES: NonTokenStrategy[] = [
  { type: "fixed-size", size: 37 },
  { type: "fixed-size", size: 500 },
  { type: "paragraphs" },
];

const ALL_TESTED_STRATEGIES: NonTokenStrategy[] = [
  ...NON_OVERLAP_STRATEGIES,
  { type: "fixed-size-overlap", size: 40, overlap: 10 },
];

describe("chunk invariants — join reproduces the source exactly (FR-010)", () => {
  for (const strategy of NON_OVERLAP_STRATEGIES) {
    it(`holds for ${strategy.type} across random documents`, () => {
      for (let trial = 0; trial < 25; trial++) {
        const content = randomText(Math.floor(Math.random() * 800));
        const chunks = chunk(content, strategy);
        expect(chunks.map((c) => c.text).join("")).toBe(content);
      }
    });
  }
});

describe("chunk invariants — text matches its own offsets", () => {
  for (const strategy of ALL_TESTED_STRATEGIES) {
    it(`holds for ${strategy.type} across random documents`, () => {
      for (let trial = 0; trial < 25; trial++) {
        const content = randomText(Math.floor(Math.random() * 600));
        const chunks = chunk(content, strategy);
        for (const c of chunks) {
          expect(c.text).toBe(content.slice(c.start, c.end));
        }
      }
    });
  }
});

describe("chunk invariants — empty documents", () => {
  const strategies: NonTokenStrategy[] = [
    { type: "fixed-size", size: 500 },
    { type: "fixed-size-overlap", size: 500, overlap: 100 },
    { type: "paragraphs" },
  ];

  it("empty content yields zero chunks, for every strategy", () => {
    for (const strategy of strategies) {
      expect(chunk("", strategy)).toEqual([]);
    }
  });

  it("whitespace-only content yields zero chunks, for every strategy", () => {
    for (const strategy of strategies) {
      expect(chunk("   \n\n  ", strategy)).toEqual([]);
    }
  });
});

describe("chunk invariants — document shorter than one chunk", () => {
  it("yields exactly one chunk spanning everything, for fixed-size and fixed-size-overlap", () => {
    const content = "short";
    const expected = [
      { index: 0, start: 0, end: content.length, text: content, length: content.length },
    ];
    expect(chunk(content, { type: "fixed-size", size: 500 })).toEqual(expected);
    expect(chunk(content, { type: "fixed-size-overlap", size: 500, overlap: 100 })).toEqual(
      expected,
    );
  });
});
