import { MetaID, VersionID, assert, FieldID, Base, another, Token, Item, trap, StaticError, Block, Value, arrayEquals, arrayLast } from "./exports";

/**
 * ID of an item. Immutable and interned, so can use ===
 * Series use plain JS numbers, either ordinals or serial numbers.
 * Strings are used as a convenience in APIs but not used as Item id
 */
export type RealID = FieldID | number;
export type ID = RealID | string;

/** Path down into the Space. A sequence of IDs starting with a VersionID.
 * Immutable after construction */
export class Path {

  readonly ids: ReadonlyArray<ID>;
  get length() { return this.ids.length }

  constructor(ids: ReadonlyArray<ID>) {
    assert(!ids.length || ids[0] instanceof VersionID);
    this.ids = ids;
  }

  static readonly empty = new Path([]);

  /** extend path downward */
  down(id: ID): Path {
    return new Path([...this.ids, id]);
  }

  /** path equality */
  equals(other: Path) {
    return (
      this.ids.length === other.ids.length
      && this.ids.every((id, i) => id === other.ids[i]));
  }

  /** Whether other path is within but not equal to this path */
  contains(other: Path): boolean {
    return (
      // must be longer
      other.length > this.length
      // not in our metadata
      && !(other.ids[this.length] instanceof MetaID)
      // must extend this path
      && this.ids.every((id, i) => id === other.ids[i]));
  }

  containsOrEquals(other: Path): boolean {
    return this.equals(other) || this.contains(other);
  }

  /** returns least upper bound with another path, which is their shared prefix
   * */
  lub(other: Path): Path {
    // where the paths diverge
    let end = this.ids.findIndex(
      (id, i) => i >= other.ids.length || id !== other.ids[i]
    );
    if (end < 0) {
      return this;
    } else {
      return new Path(other.ids.slice(0, end));
    }
  }

  /**
  * Path translation. Paths within a deep copy get translated, so that any path
  * contained in the source of the copy gets translated into a path contained in
  * the destination. Relative paths are not translated.
  */
  translate(src: Path, dst: Path): Path {
    if (src.contains(this)) {
      // translate from src to dst
      return new Path([...dst.ids, ...this.ids.slice(src.length)]);
    }
    // disallow destination from "capturing" path outside src into dst
    // this should be caught during static analysis as a cyclic reference
    assert(!dst.contains(this));
    return this;
  }

  toString() { return this.dump() };

  // dump path as dotted string
  dump() { return this.ids.join('.'); }
}