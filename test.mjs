import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Container, Inject } from './main.mjs'

test('Container.register()', async (t) => {
  const invalidTypeValues = [true, 1, {}, () => {}, null, undefined, NaN]
  for (const value of invalidTypeValues) {
    await t.test(`should NOT accept the type ${typeof value} as token`, () => {
      assert.throws(
        () => new Container().register(value),
        { message: 'Invalid token type' }
      )
    })
  }

  await t.test('should accept the type string as token', () => {
    assert.ok(new Container().register('a string', 'any value provider') instanceof Container)
  })

  await t.test('should accept the type symbol as token', () => {
    assert.ok(new Container().register(Symbol('any'), 'any value provider') instanceof Container)
  })

  await t.test('should accept a class reference as token', () => {
    assert.ok(new Container().register(class {}) instanceof Container)
  })

  await t.test('should register a class provider correctly', () => {
    const container = new Container()

    class Provider {}

    container.register(Provider)
    assert.ok(container.isRegistered(Provider))
  })

  await t.test('should require a value or factory provider when a normal token is provided', () => {
    assert.throws(
      () => new Container().register('normal'),
      { message: 'For a normal token a value or a factory provider is required' }
    )
  })

  await t.test('should register a factory provider correctly', () => {
    const container = new Container()
    container.register('provider', () => {})
    assert.ok(container.isRegistered('provider'))
  })
})

test('Container.resolve()', async (t) => {
  await t.test('should instantiate a class', () => {
    class Provider {}

    const instance = new Container()
      .register(Provider)
      .resolve(Provider)
    assert.ok(instance instanceof Provider)
  })

  await t.test('should resolve the dependencies', () => {
    class Provider1 {}

    class Provider2 {
      static [Inject] = [Provider1]

      constructor (provider1) {
        this.provider1 = provider1
      }
    }

    const container = new Container()
      .register(Provider1)
      .register(Provider2)
    const instance = container.resolve(Provider2)
    assert.ok(instance instanceof Provider2)
    assert.ok(instance.provider1 instanceof Provider1)
  })

  await t.test('should resolve the dependencies recursively', () => {
    class Provider1 {}

    class Provider2 {
      static [Inject] = [Provider1]

      constructor (provider1) {
        this.provider1 = provider1
      }
    }

    class Provider3 {
      static [Inject] = [Provider2]

      constructor (provider2) {
        this.provider2 = provider2
      }
    }

    const container = new Container()
      .register(Provider1)
      .register(Provider2)
      .register(Provider3)
    const instance = container.resolve(Provider3)
    assert.ok(instance instanceof Provider3)
    assert.ok(instance.provider2 instanceof Provider2)
    assert.ok(instance.provider2.provider1 instanceof Provider1)
  })

  await t.test('should use the singleton pattern to resolve dependencies', () => {
    class Provider {
      static constructionCount = 0
      constructor () {
        Provider.constructionCount++
      }
    }
    const container = new Container()
      .register(Provider)
    container.resolve(Provider)
    container.resolve(Provider)
    assert.equal(Provider.constructionCount, 1)
  })

  await t.test('should resolve a value provider', () => {
    class ClassProvider {
      static [Inject] = [
        'valueProvider'
      ]

      constructor (vp) {
        this.vp = vp
      }
    }
    const container = new Container()
    container.register(ClassProvider)
    container.register('valueProvider', {})
    const instance = container.resolve(ClassProvider)
    assert.deepEqual(instance.vp, {})
  })

  await t.test('should resolve a factory provider', () => {
    class ClassProvider {
      static [Inject] = [
        'factoryProvider'
      ]

      constructor (fp) {
        this.fp = fp
      }
    }
    const container = new Container()
    container.register(ClassProvider)
    container.register('factoryProvider', () => ({}))
    const instance = container.resolve(ClassProvider)
    assert.deepEqual(instance.fp, {})
  })

  await t.test('should throw an error when the provider is not registered', () => {
    class Provider {}
    assert.throws(
      () => new Container().resolve(Provider),
      { message: `The provider ${Provider.name} is not registered` }
    )
  })
})
