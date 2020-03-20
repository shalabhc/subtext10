import { Block, FieldID, Item, Value, Dictionary, assert, assertDefined, Field, Reference, cast, Text, Choice, StaticError, ID } from "./exports";

/** Metadata on an Item, containing fields with MetafieldID, and whose names all
 *start with '^' */
export class Metadata extends Block<Metafield> {

  /** logical container is base item's logical container */
  get up(): Item | undefined {
    return this.containingItem.up;
  }

  /** sets a metadata field, which must not already exist. Value can be undefined. */
  set(name: string, value?: Value): Metafield {
    let id = assertDefined(MetaID.ids[name]);
    assert(!this.getMaybe(id));
    let field = new Metafield;
    this.fields.push(field)
    field.container = this;
    field.id = id;
    // define as literal output field (a constant)
    field.isInput = false;
    field.formulaType = 'none';
    if (value) {
      field.setValue(value);
    }

    return field;
  }

}

export class Metafield extends Field<MetaID> {

  /** Previous item in metadata is previous item of the base data. Except ^rhs
   * goes to ^lhs */
  previous(): Item | undefined {
    this.usesPrevious = true;
    if (this.id === MetaID.ids['^rhs']) {
      // previous value of rhs is the lhs
      let lhs = assertDefined(this.container.getMaybe('^lhs'));
      let ref = cast(lhs.value, Reference);
      // should already have been dereferenced
      assert(ref.target);
      let option = this.container.getMaybe('^option');
      if (!option) {
        return ref.target;
      }
      // select option from previous value
      let name = cast(option.value, Text).value;
      let choice = cast(ref.target.value, Choice);
      let prevOption = choice.getMaybe(name);
      if (!prevOption) {
        throw new StaticError(this, `undefined option: ${name}`)
      }
      // use initial value of option, not current value
      return prevOption.get('^initial');
    }
    // previous value of base item
    return this.container.containingItem.previous();
  }
}

/** Globally-unique ID of a MetaField. Name starts with '^'. Immutable and
 * interned. */
export class MetaID extends FieldID {
  // MetaID doesn't use a serial #. Instead the name is the globally unique ID.
  constructor(name: string) {
    super(NaN);
    this.name = name;
  }

  /** predefined metadata IDs */
  static ids: Dictionary<MetaID> = {
    '^literal': new MetaID('^literal'),     // Literal formula
    '^reference': new MetaID('^reference'), // Reference formula
    '^code': new MetaID('^code'),           // Code block
    '^lhs': new MetaID('^lhs'),             // Dependent reference on left of :=
    '^rhs': new MetaID('^rhs'),             // Formula on right of :=
    '^option': new MetaID('^option'),       // option name on |=
    '^call': new MetaID('^call'),           // function call
    '^builtin': new MetaID('^builtin'),     // builtin call
    '^initial': new MetaID('^initial'),     // initial value of item
    '^export': new MetaID('^export'),       // Exported value
    '^exportType': new MetaID('^exportType'), // Exported value type
  }
}