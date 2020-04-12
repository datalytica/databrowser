
declare module 'typedfastbitset' {

  class TypedFastBitSet {
    constructor();
    //constructor(initial: number);
    clone(): TypedFastBitSet;
    size(): number;
    trim(): void;
    add(val: number): void;
    has(val: number): boolean;
    array(): Array<number>;
    intersection(b: TypedFastBitSet): void;
    union(b: TypedFastBitSet): void;
    new_intersection(b: TypedFastBitSet): TypedFastBitSet;
    new_union(b: TypedFastBitSet): TypedFastBitSet;

    public words: Uint32Array;
  }

  export = TypedFastBitSet;
}
