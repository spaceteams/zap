# Prismo

Prismo is a validation-first schema library with a functional Api.

Some major features are

- Flexible refinement and validation API
- Transformation, Coercion and type narrowing
- JSONSchema support

# Table of Contents

- [Quick Start](#quick-start)

  - [Schema Definitions and Type Inference](#schema-definitions-and-type-inference)
  - [Typeguards and Validations](#typeguards-and-validations)
  - [Parsing and Coercion](#parsing-and-coercion)

- [Core](#core)

  - [Schema](#schema)
  - [Validation](#validation)
  - [Refine](#refine)
  - [Coerce](#coerce)
  - [Transform and Narrow](#transform-and-narrow)

- [Simple Schema Types](#simple-schema-types)

  - [Boolean](#boolean)
  - [Date](#date)
  - [Enum](#enum)
  - [Literal](#literal)
  - [Number](#number)
  - [String](#string)

- [Composite Schema Types](#composite-schema-types)

  - [Array](#array)
  - [Object](#object)
  - [Procedure](#procedure)
  - [Promise](#promise)
  - [Record](#record)
  - [Tuple](#tuple)

- [Logic](#logic)

  - [And](#and)
  - [Not](#not)
  - [Or](#or)
  - [XOR](#xor)

- [Utility](#utility)
  - [Lazy](#lazy)
  - [Optics](#optics)
  - [Optional, Required, Nullable & Nullish](#optional-required-nullable--nullish)
  - [Partial & DeepPartial](#partial--deeppartial)
  - [ToJsonSchema](#tojsonschema)

## Quick Start

### Schema Definitions and Type Inference

To get started you only need to know a few schema types and some utility functions. Have a look at this user schema

```ts
const user = object({
  name: string(),
  dateOfBirth: optional(date()),
});
type User = InferType<typeof user>;
```

This defines a schema `user` that has a required name and an optional date of birth.

We also infer the type of the Schema which is equivalent to

```ts
type User = {
  name: string;
  dateOfBirth?: Date | undefined;
};
```

### Typeguards and Validations

This schema can now be used as a type guard

```ts
function processUser(value: unknown): string {
  if (user.accepts(value)) {
    // typescript infers value to be of type User
    return value.name;
  }
  // in this branch value is of unknown type!
  return "not a user!";
}
```

Or if you need full validation errors

```ts
const validationErrors = user.validate({ name: 12 });
console.log(translate(validationErrors));
```

will print out

```
{ name: 'value was of type number expected string' }
```

> For the sake of demonstration we use `translate()` to make the validation object more readable. Actually, `name` is not a string but an object containing more information about the validation error such as an issue code, the actual value validated against, etc...

### Parsing and Coercion

The schema type also comes with a parse function. This function builds a new object that conforms to the schema. By default however, the schema won't be able to convert types. For example

```ts
user.parse({ name: "Joe", dateOfBirth: "1999-01-01" });
```

will throw a validation error because `"1999-01-01"` is a string and not a Date object. You can fix this problem with _coercion_ like this

```ts
const coercedDate = coerce(date(), (v) => {
  if (typeof v === "string" || typeof v === "number") {
    return new Date(v);
  }
  return v;
});
const user = object({
  name: string(),
  dateOfBirth: optional(coercedDate),
});
```

The coerce function applies the `Date` only if the value is a string or a number and does not touch any other value (including dates).

> The usecase of coercion from string to Date is so common that we have `coercedDate()` as a builtin function

## Core

### Schema

At the core of Prismo is the `schema` interface. All schema functions (like `object()`, `number()`, `string()`...) return an object that implements this schema. It is defined as

```typescript
export interface Schema<I, O = I, M = { type: string }> {
  accepts: (v: unknown, options?: Partial<ValidationOptions>) => v is I;
  validate: (
    v: unknown,
    options?: Partial<ValidationOptions>
  ) => ValidationResult<I>;
  parse: (v: unknown, options?: Partial<Options>) => ParseResult<I, O>;
  meta: () => M;
}
```

which is quite a handful.

Let us start with `accepts` and `validate`. Both get a value of unknown type and run validations on it. While `validate` builds a complete `ValidationResult` containing all found validation errors, `accepts` only returns a typeguard and is slightly more efficient thatn `validate`. The type of this validation is the first generic type `I`. If you don't care for the other two generic types you can write such a schema as `Schema<I>`. Both functions also accept a set of options. Tey currently include `earlyExit` (default false) which will stop validation on the first issue and `withCoercion` (default false) which will also coerce values on Validation (see [coerce](#coerce))

Validation is great if you want to check if a value conforms to a schema, but sometimes you want to `coerce`, `tranform` a value or strip an object of additional fields. For these cases you want to call `parse()`. This function returns a Result of type

```typescript
type ParseResult<I, O> = {
  parsedValue?: O;
  validation?: ValidationResult<I>;
};
```

`parsedValue` is defined if parsing was successful, otherwise `validation` contains the validation issues found. Note that `parse` has two generic types: `I` and `O`. The first is the type the Schema accepts. The second one is `O` the output type. By default it is equal to `I` but can be changed with `transform()` or `narrow()` (see [transform and narrow](#transform-and-narrow)). Like `validate` it accepts options, so you can configure the validation step and also `ParsingOptions` that control the parsing behaviour. There is `strip` (default true) that will remove all additional properties from objects and `skipValidation` (default false) if you do not want to validate, but directly run the parse step.

The last method defined is `meta()`. It returns an object that describes the schema. For example `items(array(number()), 10).meta()` will return an object of type

```typescript
{
  type: "array";
  schema: Schema<number, number, { type: "number"; }>;
} & {
  minItems: number;
  maxItems: number;
}
```

You can use this object to traverse the schema tree (via the `schema` attribute, that is present because `array` contains another schema) or reflect on validation rules (for example `minItems` is set to `10` in the example). This object is used heavily in utility functions like [toJsonSchema()](#tojsonschema) or [partial()](#partial--deeppartial).

To make traversing the meta object tree easier we have [Optics](#optics)

### Validation

Let us have a closer look at the ValidationResult. The type is defined as

```typescript
export type ValidationResult<T, E = ValidationIssue> =
  | Validation<T, E>
  | undefined;
```

### Refine

### Coerce

By default, a schema will not try to convert values during the parse step. In that case, the parse function will return its inputs without changing them. If you want to parse values like `"1998-10-05"` as dates however, you will need coercion.

`coerce` takes a schema and a function `(v: unknown) => unknown` that may or may not convert the given value. Currently, this function is applied during `parse` before the validation step and _again_ for the actual parsing. Coercion is not applied in `accepts` or `validate` so a `coercedDate()` will still accept only dates (it is a `Schema<Date>` after all!). You can override this behaviour using the `withCoercion` option.

The predefined coerced schemas are

```
coercedBoolean,
coercedDate,
coercedNumber,
coercedString
```

They are implemented using the default coercion of javascript. Note that this comes with all the pitfalls and weirdnesses of javascript. For example `[]` is coerced to `0`, `''` or `true` with to coercedNumber, coercedString and coercedBoolean respectively.

### Transform and Narrow

After you parsed a value, you might want to further transform it. For example the schema `defaultValue(optional(number()), 42)` will parse `undefined` to 42. This schema has type `Schema<number | undefined, number>` indicating that it will still accept `undefined` but will always parse to a number.

The `defaultValue` function is implemented using `narrow()`. This function takes a schema and a projection function `(v: O) => P` where `P extends O`. This means that the narrowed type must still be assignable to the ouput type.

If you need even more powerful transformations you can use `transform()`. This function takes a schema and an arbitrary transformation `(v: O) => P`. This is very similar to `narrow()` except for the missing contraint on `P`. With this function you can implement a schema like this

```
transform(array(number()), values => Math.max(...values))
```

This schema accepts an array of numbers and parses them into their maximum value. This schema has a type like `Schema<number[], number>`.

## Simple Schema Types

### Boolean

`boolean()` accepts boolean values. It is equivalent to `literals(true, false)` but creates slightly more precise validation issues.

There is a `coercedBoolean` that uses standard JS coercion to boolean.

### Date

`date()` validates `Date` objects and accepts only if they point to an actual time by validating them against `isNaN`.

There is a `coercedDate` that uses the `Date` constructor if the value is `string` or `number`.

#### Refinements

`before` - accept dates before the given value  
`after` - accept dates after the given value

### Enum

`nativeEnum` validates native typescript enum types (not to be confused with a union of [literals](#literal)).

Defining a schema

```typescript
enum E {
  a,
  b = 12,
  c = "c",
}
const schema = nativeEnum(E);
```

results in a type `Schema<E>` that accepts the enum values `E.a` through `E.c` or their actual values `0`, `12` and `"c"`.

You can also define a `nativeEnum` from a constant object

```typescript
const constEnum = nativeEnum({
  a: "a",
  b: 12,
  c: "c",
} as const);
```

resulting in a type `Schema<"a" | "c" | 12>`.

### Literal

### Number

### String

## Composite Schema Types

### Array

### Map

### Object

### Procedure

### Promise

### Record

### Set

### Tuple

## Logic

### And

### Not

### Or

### XOR

## Utility

### Lazy

### Optics

If you want to access a schema in a nested structure like this

```typescript
const schema = object({
  a: object({
    b: object({
      c: number(),
    }),
  }),
  moreFields: number(),
});
```

you can use the meta object:

```typescript
schema.meta().schema.a.meta().schema.b.meta().schema.c;
```

this is feels cumbersome and a bit hard to read so we built a function `get`

```typescript
get(get(get(schema, "a"), "b"), "c");
```

With this function you can also reach into Maps, Records, Tuples and Procedures. For composite schemas that only have one nested schema like Array, Set and Promise we have `into`. For example

```typescript
into(array(string()));
```

will return the `string()` schema.

> These functions are inspired by [lenses and functional references](https://en.wikibooks.org/wiki/Haskell/Lenses_and_functional_references) but are unfortunately not as powerful. They are directly applied onto a schema, you are only able to reach down one level and you cannot mutate schemas. So not at all optics, but it is the spirit that counts!

If you want to mutate an existing schema you could do that together with `and` and `omit`

```typescript
and(omit(schema, "a"), get(get(schema, "a"), "b"));
```

this replaces the field `a` by `c` resulting in a `Schema<{ c: number; moreFields: number(); }>`

### Optional, Required, Nullable & Nullish

### Partial & DeepPartial

### ToJsonSchema
