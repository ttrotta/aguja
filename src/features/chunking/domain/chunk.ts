/** A contiguous span of the document: the half-open range [start, end). */
export type Chunk = {
  index: number;
  start: number;
  end: number;
  text: string;
  length: number;
};

/** A maximal region covered by an identical set of chunks. */
export type Segment = {
  start: number;
  end: number;
  chunkIndices: number[];
};
