# zap ⚡

zap is a validation-first schema library with a functional Api.

Some major features are

- Flexible refinement and validation API
- Transformation, Coercion and type narrowing
- JSONSchema support

## Quick Start

### Install

```
npm install @spaceteams/zap
or
yarn add @spaceteams/zap
```

then import functions directly like this

```typescript
import { number, object } from "@spaceteams/zap";
const mySchema = object({ a: number() });
```

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

# Table of Contents

> 🚧 A lot of chapters of the documention are still missing. But each chapter links to relevant source code and specs.

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

## Core

### Schema

> [spec](src/schema.spec.ts) and [source](src/schema.ts)

At the core of zap is the `schema` interface. All schema functions (like `object()`, `number()`, `string()`...) return an object that implements it. It is defined as

```typescript
export interface Schema<I, O = I, M = { type: string }> {
  accepts: (v: unknown, options?: Partial<ValidationOptions>) => v is I;
  validate: (
    v: unknown,
    options?: Partial<ValidationOptions>
  ) => ValidationResult<I>;
  validateAsync: (
    v: unknown,
    options?: Partial<ValidationOptions>
  ) => Promise<ValidationResult<I>>;
  parse: (v: unknown, options?: Partial<Options>) => ParseResult<I, O>;
  parseAsync: (
    v: unknown,
    options?: Partial<Options>
  ) => Promise<ParseResult<I, O>>;
  meta: () => M;
}
```

which is quite a handful.

Let us start with `accepts` and `validate`. Both get a value of unknown type and run validations on it. While `validate` builds a complete `ValidationResult` containing all found validation errors, `accepts` only returns a typeguard and is slightly more efficient thatn `validate`. The type of this validation is the first generic type `I`. If you don't care for the other two generic types you can write such a schema as `Schema<I>`. Both functions also accept a set of options. Tey currently include `earlyExit` (default false) which will stop validation on the first issue and `withCoercion` (default false) which will also coerce values on Validation (see [coerce](#coerce))

There is an async version of both validate and parse available. These are needed if you use [async refinements](#refine).

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

> [spec](src/validation.spec.ts) and [source](src/validation.ts)

Let us have a closer look at the ValidationResult. The type is defined as

```typescript
export type ValidationResult<T, E = ValidationIssue> =
  | Validation<T, E>
  | undefined;
```

So it is dependent on `T` and an error type `E`. By default the error type is a `ValidationIssue`. This class extends `Error` so it can be thrown nicely and it contains a `ValidationIssueCode`, a custom error `message`, the validated `value` and a list of `args` to give further information about the validation. Using the `translate` method you can transform a `ValidationResult<T, ValidationIssue>` into a `ValidationResult<T, string>` containing user readable validation errors. The default translator is a bit technical though, so it is up to you to translate `ValidationIssues` for your users.

The `ValidationResult` can now either by `undefined` indicating a success or a `Validation<T, E>` indicating a failure. You can check this with `isSuccess` and `isFailure` functions. The `ValidationResult` has a pretty complicated typedefinition but it tries to resamble a deeply partial `T` with ValidationIssues instead of the actual types. Consider this validation:

```typescript
type Value = {
  array: number[];
  nested: {
    id: string;
  };
};
const validation: Validation<Value, string> = {
  array: [undefined, "validation error"],
  nested: "object invalid",
};
```

This is a validation of type `Validation<Value, string>` so it validates `Value` and uses a `string` to describe validation issues. In the example the second entry of `array` has a validation error and the `nested` object itself has a validation error.

By default zap will keep on validation even if an issue has been encountered (you can change this with the `earlyExit` flag). We even keep on validating through an `and` schema (aka Intersection type) and merge the individual Validation objects. This is especially helpful when validating complex forms.

### Refine

> [spec](src/refine.spec.ts) and [source](src/refine.ts)

Out of the box zap supports a lot of validation methods. Methods like `length` for strings or `after` for dates. These validation methods (or refinements) are described together with their applicable schemas.

You can build custom validation methods, however. And the simplest way is the `validIf` function

```typescript
validIf(number(), (v) => v % 2 === 0, "must be even");
```

This function creates a validation error if the given number is not even.

The next powerful refinement function is just called `refine`. It takes a schema and a function `(v: I, ctx: RefineContext<P>) => void | ValidationResult<P>`. Where the `ctx` object contains both the `ValidationOptions` and helper methods `add` and `validIf`. The generic Parameter `P` is defined as `P extends I = I`, which means that it is `I` by default or it [narrows](#transform-and-narrow) it further.

Refine supports three styles of refinement:

```typescript
const schema = object({ a: string(), b: number() });
const defaultStyle = refine(schema, ({ a, b }) => {
  if (a.length !== b) {
    return {
      a: new ValidationIssue("generic", "a must have length of b", v),
    };
  }
});
const builderStyle = refine(schema, ({ a, b }, { add }) => {
  if (a.length !== b) {
    add({
      a: new ValidationIssue("generic", "a must have length of b", v),
    });
  }
});
const inlineStyle = refine(schema, ({ a, b }, { validIf }) => ({
  a: validIf(a.length === b, "a must have length of b"),
}));
```

Here we refine an object `{a: string, b: number}` so that the string `a` has length `b`. In the first style the `ValidationResult` itself is returned. This is very similar to the `refine` method the `Schema` supports. The second style is using the `add` method. This approach is useful if you want to iteratively collect validation errors and have them merged into a final validation result. And finally, there is an inline style using the `validIf` method. The advantage of `refine` over the simpler `validIf` is that you can add validation errors anywhere in the `ValidationResult`. For exmple you could validate the `age` field and write the error inside the `name` field. Also you can do narrowing:

```typescript
refine(
  object({ id: optional(string()) }),
  (v, ctx: RefineContext<{ id: string }>) => ({
    id: ctx.validIf(v !== undefined, "must be present"),
  })
);
```

which will result in a type `{id: string}` and not `{id?: string | undefined}`.

> Most of zap's built-in validation functions are implemented using `refineWithMetainformation`. They add meta-information that can be picked up and interpreted by utility functions like `toJsonSchema`

There are also `validIfAsync`, `refineAsync` and `refineAsyncWithMetaInformation`. Consider validation of a user registration

```typescript
// call the backend
const userAvailable = (_username: string) => Promise.resolve(true);

export const userRegistration = object({
  username: validIfAsync(
    string(),
    userAvailable,
    "this username is already taken"
  ),
});
```

This will call the function `userAvailable` if `userName` is a string and await the result. You should of course consider to debounce, deduplicate and cache your requests to the backend depending on your usecase. To use this schema you have to call `validateAsync` and `refineAsync`, the synchronous versions will result in validation errors.

### Coerce

> [spec](src/schema.spec.ts) and [source](src/schema.ts)

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

> [spec](src/schema.spec.ts) and [source](src/schema.ts)

After you parsed a value, you might want to further transform it. For example the schema `defaultValue(optional(number()), 42)` will parse `undefined` to 42. This schema has type `Schema<number | undefined, number>` indicating that it will still accept `undefined` but will always parse to a number.

The `defaultValue` function is implemented using `narrow()`. This function takes a schema and a projection function `(v: O) => P` where `P extends O`. This means that the narrowed type must still be assignable to the ouput type.

If you need even more powerful transformations you can use `transform()`. This function takes a schema and an arbitrary transformation `(v: O) => P`. This is very similar to `narrow()` except for the missing contraint on `P`. With this function you can implement a schema like this

```
transform(array(number()), values => Math.max(...values))
```

This schema accepts an array of numbers and parses them into their maximum value. This schema has a type like `Schema<number[], number>`.

## Simple Schema Types

### BigInt

> [spec](src/simple/bigint.spec.ts) and [source](src/simple/bigint.ts)

`bigInt()` accepts BigInt values.

There is a `coercedBigInt` that uses standard JS coercion using the BigInt constructor.

Most of the [Number](#number) refinements also work for bigInt.

### Boolean

> [spec](src/simple/boolean.spec.ts) and [source](src/simple/boolean.ts)

`boolean()` accepts boolean values. It is equivalent to `literals(true, false)` but creates slightly more precise validation issues.

There is a `coercedBoolean` that uses standard JS coercion to boolean.

### Date

> [spec](src/simple/date.spec.ts) and [source](src/simple/date.ts)

`date()` validates `Date` objects and accepts only if they point to an actual time by validating them against `isNaN`.

There is a `coercedDate` that uses the `Date` constructor if the value is `string` or `number`.

#### Validation Functions

`before` - accept dates before the given value  
`after` - accept dates after the given value

### Enum

> [spec](src/simple/enum.spec.ts) and [source](src/simple/enum.ts)

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

> [spec](src/simple/literal.spec.ts) and [source](src/simple/literal.ts)

### Number

> [spec](src/simple/number.spec.ts) and [source](src/simple/number.ts)

### String

> [spec](src/simple/string.spec.ts) and [source](src/simple/string.ts)

## Composite Schema Types

### Array

> [spec](src/composite/array.spec.ts) and [source](src/composite/array.ts)

### Map

> [spec](src/composite/map.spec.ts) and [source](src/composite/map.ts)

### Object

> [spec](src/composite/object.spec.ts) and [source](src/composite/object.ts)

### Procedure

> [spec](src/composite/procedure.spec.ts) and [source](src/composite/procedure.ts)

### Promise

> [spec](src/composite/promise.spec.ts) and [source](src/composite/promise.ts)

### Record

> [spec](src/composite/record.spec.ts) and [source](src/composite/record.ts)

### Set

> [spec](src/composite/set.spec.ts) and [source](src/composite/set.ts)

### Tuple

> [spec](src/composite/tuple.spec.ts) and [source](src/composite/tuple.ts)

## Logic

### And

> [spec](src/logic/and.spec.ts) and [source](src/logic/and.ts)

### Not

> [spec](src/logic/not.spec.ts) and [source](src/logic/not.ts)

### Or

> [spec](src/logic/or.spec.ts) and [source](src/logic/or.ts)

### XOR

> [spec](src/logic/xor.spec.ts) and [source](src/logic/xor.ts)

## Utility

### Lazy

> [spec](src/utility/lazy.spec.ts) and [source](src/utility/lazy.ts)

### Optics

> [spec](src/utility/optics.spec.ts) and [source](src/utility/optics.ts)

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

> Optional: [spec](src/utility/optional.spec.ts) and [source](src/utility/optional.ts)

### Partial & DeepPartial

> Partial: [spec](src/utility/partial.spec.ts) and [source](src/utility/partial.ts)
> DeepPartial: [spec](src/utility/deep-partial.spec.ts) and [source](src/utility/deep-partial.ts)

### ToJsonSchema

> [spec](src/utility/to-json-schema.spec.ts) and [source](src/utility/to-json-schema.ts)
