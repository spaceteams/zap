import * as DateS from "./date";
import * as Boolean from "./boolean";
import * as StringS from "./string";
import * as ObjectS from "./object";
import * as Record from "./record";
import * as Literal from "./literal";
import {
  nativeEnum as makeEnum,
  tuple as makeTuple,
  optional,
  required,
  nullable,
  nullish,
  defaultValue,
  or,
  ArrayUtils,
  EnumLike,
  and,
  ValidationResult,
  coerce,
  json,
  narrow,
  refine,
  Schema,
  ValidationOptions,
  NumberUtils,
} from ".";

export class BaseSchema<T> implements Schema<T> {
  constructor(protected readonly schema: Schema<T>) {}

  accepts = this.schema.accepts;
  validate = this.schema.validate;
  parse = this.schema.parse;

  optional = () => new OptionalSchema(optional(this.schema));
  nullable = () => new BaseSchema(nullable(this.schema));
  nullish = () => new BaseSchema(nullish(this.schema));

  refine = (
    validate: (v: T, o: ValidationOptions) => ValidationResult<T> | void
  ) => new BaseSchema(refine(this.schema, validate));
  coerce = (coercion: (v: unknown) => unknown) =>
    new BaseSchema(coerce(this.schema, coercion));
  narrow = <S extends T>(projection: (v: T) => S) =>
    new BaseSchema(narrow(this.schema, projection));
  json = () => new BaseSchema(json(this.schema));

  and = <S>(other: Schema<S> | ((v: T) => Schema<S>)) =>
    new BaseSchema(and(this.schema, other));
  or = <S>(other: Schema<S>) => new BaseSchema(or(this.schema, other));
}

export class OptionalSchema<T> extends BaseSchema<T | undefined> {
  required = () => new BaseSchema(required(this.schema));
  default = (value: T) => new BaseSchema(defaultValue(this.schema, value));
}

export function array<T>(schema: Schema<T>): ArraySchema<T> {
  return new ArraySchema(ArrayUtils.array(schema));
}
class ArraySchema<T> extends BaseSchema<T[]> {
  min = (minLength: number) =>
    new ArraySchema(ArrayUtils.min(this.schema, minLength));
  max = (maxLength: number) =>
    new ArraySchema(ArrayUtils.max(this.schema, maxLength));
  length = (length: number) =>
    new ArraySchema(ArrayUtils.length(this.schema, length));
  includes = (element: T, fromIndex: number) =>
    new ArraySchema(ArrayUtils.includes(this.schema, element, fromIndex));
  nonEmpty = () => new ArraySchema(ArrayUtils.nonEmpty(this.schema));
}

export function boolean(): BaseSchema<boolean> {
  return new BaseSchema(Boolean.boolean());
}

export function date(): DateSchema {
  return new DateSchema(DateS.date());
}
class DateSchema extends BaseSchema<Date> {
  before = (value: Date) => new DateSchema(DateS.before(this.schema, value));
  after = (value: Date) => new DateSchema(DateS.after(this.schema, value));
}

export function nativeEnum(e: EnumLike): BaseSchema<number | string> {
  return new BaseSchema(makeEnum(e));
}

export function literal(value: string | number | boolean) {
  return new BaseSchema(Literal.literal(value));
}

export function number() {
  return new NumberSchema(NumberUtils.number());
}
class NumberSchema extends BaseSchema<number> {
  positive = () => new NumberSchema(NumberUtils.positive(this.schema));
  negative = () => new NumberSchema(NumberUtils.negative(this.schema));
  nonNegative = () => new NumberSchema(NumberUtils.nonNegative(this.schema));
  integer = () => new NumberSchema(NumberUtils.integer(this.schema));
  multipleOf = (value: number) =>
    new NumberSchema(NumberUtils.multipleOf(this.schema, value));
  lessThan = (value: number) =>
    new NumberSchema(NumberUtils.lessThan(this.schema, value));
  greaterThan = (value: number) =>
    new NumberSchema(NumberUtils.greaterThan(this.schema, value));
  lessThanOrEqual = (value: number) =>
    new NumberSchema(NumberUtils.lessThanOrEqual(this.schema, value));
  greaterThanOrEqual = (value: number) =>
    new NumberSchema(NumberUtils.greaterThanOrEqual(this.schema, value));
}

export function nan() {
  return new BaseSchema(NumberUtils.nan());
}

export function object<T>(schema: {
  [K in keyof T]: Schema<T[K]>;
}) {
  return new ObjectSchema(ObjectS.object(schema));
}
class ObjectSchema<T> extends BaseSchema<T> {
  isInstance = (constructor: { new (...args: unknown[]): T }) =>
    new ObjectSchema(ObjectS.isInstance(this.schema, constructor));
  omit = <K extends keyof T>(...keys: K[]) =>
    new ObjectSchema(ObjectS.omit(this.schema, ...keys));
  pick = <K extends keyof T>(...keys: K[]) =>
    new ObjectSchema(ObjectS.pick(this.schema, ...keys));
  at = <K extends keyof T>(key: K) =>
    new ObjectSchema(ObjectS.at(this.schema, key));
}

export function record<T>(schema: Schema<T>) {
  return new BaseSchema(Record.record(schema));
}

export function tuple<T extends Schema<unknown>[]>(...schemas: T) {
  return new BaseSchema(makeTuple(...schemas));
}

export function string() {
  return new StringSchema(StringS.string());
}
class StringSchema extends BaseSchema<string> {
  min = (minLength: number) =>
    new StringSchema(StringS.min(this.schema, minLength));
  max = (maxLength: number) =>
    new StringSchema(StringS.max(this.schema, maxLength));
  length = (length: number) =>
    new StringSchema(StringS.length(this.schema, length));
  nonEmpty = () => new StringSchema(StringS.nonEmpty(this.schema));
  regex = (regex: RegExp) =>
    new StringSchema(StringS.regex(this.schema, regex));
  startsWith = (searchString: string, position?: number) =>
    new StringSchema(StringS.startsWith(this.schema, searchString, position));
  endsWith = (searchString: string, position?: number) =>
    new StringSchema(StringS.endsWith(this.schema, searchString, position));
}
