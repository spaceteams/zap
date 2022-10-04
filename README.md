# Lib Name Here

# Table of Contents

- [Quick Start](#quick-start)

  - [Schema Definitions and Type Inference](#schema-definitions-and-type-inference)
  - [Typeguards and Validations](#typeguards-and-validations)
  - [Parsing and Coercion](#parsing-and-coercion)

- [Core](#core)

  - [Schema](#schema)
  - [Refine](#refine)
  - [Coerce](#coerce)
  - [Narrow](#narrow)
  - [Validation Result](#validation-result)

- [Simple Schema Types](#simple-schema-types)

  - [Boolean](#boolean)
  - [Date](#date)
  - [Enum](#enum)
  - [Fun](#fun)
  - [Literal](#literal)
  - [Number](#number)
  - [String](#string)

- [Composite Schema Types](#composite-schema-types)

  - [Array](#array)
  - [Object](#object)
  - [Record](#record)
  - [Tuple](#tuple)

- [Logic](#logic)

  - [And](#and)
  - [Not](#not)
  - [Or](#or)
  - [XOR](#xor)

- [Utility](#utility)
  - [Conversion Graph](#conversion-graph)
  - [Lazy](#lazy)
  - [Optional, Required, Nullable & Nullish](#optional-required-nullable--nullish)
  - [Partial & DeepPartial](#partial--deeppartial)
  - [ToJsonSchema](#tojsonschema)

## Quick Start

### Schema Definitions and Type Inference

To get started you only need a few schema types and some utility functions. Have a look at this user type

```ts
const user = object({
  name: string(),
  dateOfBirth: optional(date()),
});
type User = InferType<typeof user>;
```

This defines a schema `user` that has a required name and an optional age. If the age is present then it must be a number larger than zero.

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
  // value is of unknown type down here!
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

> For the sake of demonstration we use `translate()` to make the validation object more readable. Actually, `name` is not a string but an object containing more information about the validation error.

### Parsing and Coercion

The schema type also has a parse function built in. This function will built a new object that conforms to the schema. By default however, the schema won't be able to convert types. For example

```ts
user.parse({ name: "Joe", dateOfBirth: "1999-01-01" });
```

will throw a validation error because `"1999-01-01"` is a string and not a Date object. You can fix this problem like this

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

### Refine

### Coerce

### Narrow

### Validation Result

## Simple Schema Types

### Boolean

### Date

### Enum

### Fun

### Literal

### Number

### String

## Composite Schema Types

### Array

### Object

### Record

### Tuple

## Logic

### And

### Not

### Or

### XOR

## Utility

### Conversion Graph

### Lazy

### Optional, Required, Nullable & Nullish

### Partial & DeepPartial

### ToJsonSchema
