export const Inject = Symbol("IoC::ProviderDependencies");

type Injectable = {
  [Inject]: Array<string | symbol>;
};

type Factory = (c: Container) => unknown;
type Primitives =
  | number
  | string
  | boolean
  | Record<string, unknown>
  | Set<any>;

type Registry = Constructor | Factory | Primitives;
type Token = Constructor | string | symbol;

type Constructor<T = any> = {
  new (...args: any[]): T;
}

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
            dependency,
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

/*******************************************************************************
 * EXAMPLES
 */

const TODO_COLLECTION = Symbol("TodoRegistry");
const ID_GENERATOR = "ID_GENERATOR";
interface IdGenerator {
  generate(): string;
}

type Todo = { id: string; name: string };

class TodoRepository {
  static [Inject] = [
    TODO_COLLECTION,
    ID_GENERATOR,
  ];

  constructor(
    readonly todoCollection: Set<Todo>,
    readonly idGenerator: IdGenerator,
  ) {
  }

  add(name: string) {
    const todo: Todo = {
      id: this.idGenerator.generate(),
      name,
    };
    this.todoCollection.add(todo);
    return todo;
  }
}

class TodoService {
  static [Inject] = [
    TodoRepository,
  ];

  constructor(readonly addTodoRepository: TodoRepository) {
  }

  add(name: string) {
    return this.addTodoRepository.add(name);
  }
}

class AddTodoController {
  static [Inject] = [
    TodoService,
  ];

  constructor(readonly addTodoService: TodoService) {
    this.addTodoService = addTodoService;
  }

  handle(name: string) {
    return this.addTodoService.add(name);
  }
}

const container = new Container()
  .register(AddTodoController)
  .register(TodoService)
  .register(TodoRepository)
  .register(TODO_COLLECTION, new Set())
  .register(ID_GENERATOR, () => ({ generate: () => crypto.randomUUID() }))

const controller = container.resolve(AddTodoController);

console.log(controller.handle("estudar solid"));
console.log(controller);
