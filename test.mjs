import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Container } from './main.mjs'

class AnyProvider {}

class AnyProviderWithDeps {
    constructor (dep1) {
        this.dep1 = dep1
    }
}

class Dep1 {}

class Dep1WithDeps {
    constructor (dep2) {
        this.dep2 = dep2
    }
}

class Dep2 {

}

test('Container.register()', async (t) => {
    await t.test('should only allow class references as providers', () => {
        assert.throws(
            () => new Container().register('wrong class reference'),
            { message: 'The provider must be a class reference' }
        )
    })

    // first version
    // await t.test('should add the provider to the providers collection', () => {
    //     const container = new Container()
    //     container.register(AnyProvider)
    //     assert.ok(container.providers.get(AnyProvider.name))
    // })
    //
    // await t.test('should register the provider as a class reference', () => {
    //     const container = new Container()
    //     container.register(AnyProvider)
    //     const registeredProvider = container.providers.get(AnyProvider.name)
    //     assert.ok(typeof registeredProvider === 'function')
    //     assert.ok(registeredProvider.toString().startsWith('class'))
    // })

    await t.test('should register the provider with its dependencies', () => {
        const container = new Container()
        container.register(AnyProviderWithDeps, [Dep1])
        const { providerClass, dependencies } = container.providers.get(AnyProviderWithDeps.name)
        assert.ok(typeof providerClass === 'function')
        assert.ok(providerClass.toString().startsWith('class'))
        assert.deepEqual(dependencies, [Dep1])
    })
})

test('Container.resolve()', async (t) => {
    await t.test('should validate if the provider exists in the providers collection', () => {
        assert.throws(() => new Container().resolve(AnyProvider),
            { message: 'Provider not found' }
        )

    })
    await t.test('should register a provider instance', () => {
        const container = new Container()
        container.register(AnyProvider)
        container.resolve(AnyProvider)
        const instance = container.instances.get(AnyProvider.name)
        assert.ok(instance instanceof AnyProvider)
    })

    await t.test('should return the provider instance', () => {
        const container = new Container()
        container.register(AnyProvider)
        const instance = container.resolve(AnyProvider)
        assert.ok(instance instanceof AnyProvider)
    })

    await t.test('should resolve the provider dependencies', () => {
        const container = new Container()
        container.register(AnyProviderWithDeps, [Dep1])
        container.register(Dep1)
        const instance = container.resolve(AnyProviderWithDeps)
        assert.ok(instance instanceof AnyProviderWithDeps)
        assert.ok(instance.dep1 instanceof Dep1)
    })

    await t.test('should resolve dependencies from provider dependencies', () => {
        const container = new Container()
        container.register(AnyProviderWithDeps, [Dep1WithDeps])
        container.register(Dep1WithDeps, [Dep2])
        container.register(Dep2)
        const instance = container.resolve(AnyProviderWithDeps)
        assert.ok(instance instanceof AnyProviderWithDeps)
        assert.ok(instance.dep1 instanceof Dep1WithDeps)
        assert.ok(instance.dep1.dep2 instanceof Dep2)
    })
})
