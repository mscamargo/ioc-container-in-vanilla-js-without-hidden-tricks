
export const Inject = Symbol("IoC::ProviderDependencies");

export class Container {
  #registry= new Map();
  #singletons = new Map();

  register(token, valueOrFactory) {
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

  resolve(ClassOrToken) {
    const token=  ClassOrToken.name ??  ClassOrToken;
    if (!this.isRegistered(ClassOrToken)) {
      throw new Error(`The provider ${token.toString()} is not registered`);
    }
    if (!this.#singletons.has(token)) {
      const Provider = this.#registry.get(token);
      let instance = Provider;
      if (this.#isClass(Provider)) {
        const dependencies =
          Provider[Inject]?.map((
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

  isRegistered(token) {
    return this.#registry.has(
      this.#isClass(token) ? token.name : token,
    );
  }

  #isValid(token) {
    return this.#isSymbol(token) ||
      this.#isString(token) ||
      this.#isClass(token);
  }

  #isSymbol(val) {
    return typeof val === "symbol";
  }

  #isString(val) {
    return typeof val === "string";
  }

  #isClass(val) {
    return typeof val === "function" && val.toString().startsWith("class");
  }
}
