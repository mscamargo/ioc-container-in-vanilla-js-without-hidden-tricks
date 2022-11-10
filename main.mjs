import { randomUUID } from 'node:crypto'
export const Inject = Symbol('IoC::ProviderDependencies')

export class Container {
  #registry = new Map()
  #singletons = new Map()

  register (ClassOrToken, valueOrFactory) {
    if (!this.#isValid(ClassOrToken)) {
      throw new Error('Invalid token type')
    }
    if (this.#isClass(ClassOrToken)) {
      this.#registry.set(ClassOrToken.name, ClassOrToken)
    } else {
      if (!valueOrFactory) {
        throw new Error('For a normal token a value or a factory provider is required')
      }
      this.#registry.set(ClassOrToken, valueOrFactory)
    }
    return this
  }

  resolve (ClassOrToken) {
    const token = ClassOrToken.name ?? ClassOrToken
    if (!this.isRegistered(ClassOrToken)) {
      throw new Error(`The provider ${token.toString()} is not registered`)
    }
    if (!this.#singletons.has(token)) {
      const Provider = this.#registry.get(token)
      let instance = Provider
      if (this.#isClass(Provider)) {
        const dependencies = Provider[Inject]?.map(dependency => this.resolve(dependency)) ?? []
        instance = new Provider(...dependencies)
      } else if (typeof Provider === 'function') {
        instance = Provider()
      }
      this.#singletons.set(token, instance)
    }
    return this.#singletons.get(token)
  }

  isRegistered (tokenOrClass) {
    return this.#registry.has(
      this.#isClass(tokenOrClass) ? tokenOrClass.name : tokenOrClass
    )
  }

  #isValid (token) {
    return this.#isSymbol(token) ||
        this.#isString(token) ||
        this.#isClass(token)
  }

  #isSymbol (token) {
    return typeof token === 'symbol'
  }

  #isString (token) {
    return typeof token === 'string'
  }

  #isClass (token) {
    return typeof token === 'function' && token.toString().startsWith('class')
  }
}

/*******************************************************************************
 * EXAMPLES
 */

const TODO_COLLECTION = Symbol('TodoRegistry')
const ID_GENERATOR = 'ID_GENERATOR'

class TodoRepository {
  static [Inject] = [
    TODO_COLLECTION,
    ID_GENERATOR
  ]

  constructor (todoCollection, idGenerator) {
    this.todoCollection = todoCollection
    this.idGenerator = idGenerator
  }

  add (name) {
    const todo = {
      id: this.idGenerator.generate(),
      name
    }
    this.todoCollection.add(todo)
    return todo
  }
}

class TodoService {
  static [Inject] = [
    TodoRepository
  ]

  constructor (addTodoRepository) {
    this.addTodoRepository = addTodoRepository
  }

  add (name) {
    return this.addTodoRepository.add(name)
  }
}

class AddTodoController {
  static [Inject] = [
    TodoService
  ]

  constructor (addTodoService) {
    this.addTodoService = addTodoService
  }

  handle (name) {
    return this.addTodoService.add(name)
  }
}

const container = new Container()
  .register(AddTodoController)
  .register(TodoService)
  .register(TodoRepository)
  .register(TODO_COLLECTION, new Set())
  .register(ID_GENERATOR, () => ({ generate: () => randomUUID() }))

const controller = container.resolve(AddTodoController)

console.log(controller.handle('estudar solid'))
console.log(controller)
