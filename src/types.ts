import { Container, Inject } from "./container.ts";

export type Injectable = {
  [Inject]: Array<string | symbol>;
};

export type Factory = (c: Container) => unknown;

export type Primitives =
  | number
  | string
  | boolean
  | Record<string, unknown>
  | Set<any>;

export type Registry = Constructor | Factory | Primitives;
export type Token = Constructor | string | symbol;

export type Constructor<T = any> = {
  new (...args: any[]): T;
}