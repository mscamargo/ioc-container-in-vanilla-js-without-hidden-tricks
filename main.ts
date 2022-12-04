import { Container, Inject } from './src/container.ts'
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
