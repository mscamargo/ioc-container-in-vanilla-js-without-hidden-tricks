import { Constructor, Factory, Injectable, Registry, Token } from "./types.ts";
export const Inject = Symbol("IoC::ProviderDependencies");

export class Container {
  #registry: Map<string | symbol, Registry> = new Map();
  #singletons = new Map();

  register(token: Constructor): this;
  register(token: string | symbol, valueOrFactory: Factory): this;
  register(token: string | symbol, valueOrFactory: any): this;
  register(token: any, valueOrFactory?: any): this {
    if (!this.#isValid(token)) {
      throw new Error("Invalid token type");
    }
    if (this.#isClass(token)) {
      this.#registry.set(token.name, token);
    } else {
      if (!valueOrFactory) {
        throw new Error(
          "For a normal token a value or a factory provider is required",
        );
      }
      this.#registry.set(token, valueOrFactory);
    }
    return this;
  }

  resolve<T>(ClassOrToken: Constructor<T>): T;
  resolve<T>(ClassOrToken: string | symbol): T;
  resolve(ClassOrToken: Constructor | string | symbol) {
    const token: string | symbol = (<Constructor> ClassOrToken).name ??
      ClassOrToken;
    if (!this.isRegistered(ClassOrToken)) {
      throw new Error(`The provider ${token.toString()} is not registered`);
    }
    if (!this.#singletons.has(token)) {
      const Provider: Registry = this.#registry.get(token)!;
      let instance: unknown = Provider;
      if (this.#isClass(Provider)) {
        const dependencies =
          (Provider as unknown as Partial<Injectable>)[Inject]?.map((
            dependency
          ) => this.resolve(dependency)) ?? [];
        instance = new Provider(...dependencies);
      } else if (typeof Provider === "function") {
        instance = Provider(this);
      }
      this.#singletons.set(token, instance);
    }
    return this.#singletons.get(token);
  }

  isRegistered(token: Token) {
    return this.#registry.has(
      this.#isClass(token) ? token.name : token,
    );
  }

  #isValid(token: Token): boolean {
    return this.#isSymbol(token) ||
      this.#isString(token) ||
      this.#isClass(token);
  }

  #isSymbol(val: unknown): val is symbol {
    return typeof val === "symbol";
  }

  #isString(val: unknown): val is string {
    return typeof val === "string";
  }

  #isClass(val: unknown): val is Constructor {
    return typeof val === "function" && val.toString().startsWith("class");
  }
}
