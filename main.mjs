import { randomUUID } from 'node:crypto'

export class Container {
    providers = new Map()
    instances = new Map()

    register (providerClass, dependencies = []) {
        const isClass = typeof providerClass === 'function' && providerClass.toString().startsWith('class')
        if (!isClass) {
            throw new Error('The provider must be a class reference')
        }
        this.providers.set(providerClass.name, { providerClass, dependencies })
    }

    resolve (providerClass) {
        if (!this.providers.has(providerClass.name)) {
            throw new Error('Provider not found')
        }
        const provider = this.providers.get(providerClass.name)
        const dependencies = provider.dependencies.map((dependency) => this.resolve(dependency))
        const instance = new provider.providerClass(...dependencies)
        this.instances.set(providerClass.name, instance)
        return instance
    }
}

class AddTodoController {
    constructor (addTodoService) {
        this.addTodoService = addTodoService
    }

    handle (name) {
        return this.addTodoService.add(name)
    }
}

class TodoService {
    constructor (addTodoRepository) {
        this.addTodoRepository = addTodoRepository
    }

    add (name) {
        return this.addTodoRepository.add(name)
    }
}

class TodoRepository {
    todos = []

    add (name) {
        const todo = {
            id: randomUUID(),
            name
        }
        this.todos.push(todo)
        return todo
    }
}

const container = new Container()
container.register(AddTodoController, [TodoService])
container.register(TodoService, [TodoRepository])
container.register(TodoRepository)

const controller = container.resolve(AddTodoController)

console.log({ controller })
console.log(controller.handle('estudar solid'))
