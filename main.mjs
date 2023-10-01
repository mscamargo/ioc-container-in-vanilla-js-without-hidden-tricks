import { Container, Inject } from './src/container.mjs'
/*******************************************************************************
 * EXAMPLES
 */

const TODO_COLLECTION = Symbol("TodoRegistry");
const ID_GENERATOR = "ID_GENERATOR";

class TodoRepository {
  static [Inject] = [
    TODO_COLLECTION,
    ID_GENERATOR,
  ];

  /**
   * 
   * @param {Set} todoCollection 
   * @param {*} idGenerator 
   */
  constructor(
     todoCollection,
     idGenerator,
  ) {
    this.todoCollection = todoCollection
    this.idGenerator = idGenerator
  }

  /**
   * 
   * @param {string} name 
   * @returns {Todo}
   */
  add(name) {
    const todo = {
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

  constructor( addTodoRepository) {
    this.addTodoRepository = addTodoRepository
  }

  /**
   * 
   * @param {string} name 
   * @returns 
   */
  add(name) {
    return this.addTodoRepository.add(name);
  }
}

class AddTodoController {
  static [Inject] = [
    TodoService,
  ];

  constructor(addTodoService) {
    this.addTodoService = addTodoService;
  }

  /**
   * 
   * @param {string} name 
   * @returns 
   */
  handle(name) {
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
