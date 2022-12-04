import { assert, assertThrows, assertEquals } from 'https://deno.land/std@0.167.0/testing/asserts.ts'
import { Container, Inject } from './src/container.ts'

Deno.test('Container.register()', async (t) => {
  const invalidTypeValues = [true, 1, {}, () => {}, null, undefined, NaN]
  for (const value of invalidTypeValues) {
    await t.step(`should NOT accept the type ${typeof value} as token`, () => {
      assertThrows(
        () => new Container().register(value),
        { message: 'Invalid token type' }
      )
    })
  }

  await t.step('should accept the type string as token', () => {
    assert(new Container().register('a string', 'any value provider') instanceof Container)
  })

  await t.step('should accept the type symbol as token', () => {
    assert(new Container().register(Symbol('any'), 'any value provider') instanceof Container)
  })

  await t.step('should accept a class reference as token', () => {
    assert(new Container().register(class {}) instanceof Container)
  })

  await t.step('should register a class provider correctly', () => {
    const container = new Container()

    class Provider {}

    container.register(Provider)
    assert(container.isRegistered(Provider))
  })

  await t.step('should require a value or factory provider when a normal token is provided', () => {
    assertThrows(
      () => new Container().register('normal'),
      { message: 'For a normal token a value or a factory provider is required' }
    )
  })

  await t.step('should register a factory provider correctly', () => {
    const container = new Container()
    container.register('provider', () => {})
    assert(container.isRegistered('provider'))
  })
})

Deno.test('Container.resolve()', async (t) => {
  await t.step('should instantiate a class', () => {
    class Provider {}

    const instance = new Container()
      .register(Provider)
      .resolve(Provider)
    assert(instance instanceof Provider)
  })

  await t.step('should resolve the dependencies', () => {
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
    assert(instance instanceof Provider2)
    assert(instance.provider1 instanceof Provider1)
  })

  await t.step('should resolve the dependencies recursively', () => {
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
    assert(instance instanceof Provider3)
    assert(instance.provider2 instanceof Provider2)
    assert(instance.provider2.provider1 instanceof Provider1)
  })

  await t.step('should use the singleton pattern to resolve dependencies', () => {
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
    assertEquals(Provider.constructionCount, 1)
  })

  await t.step('should resolve a value provider', () => {
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
    assertEquals(instance.vp, {})
  })

  await t.step('should resolve a factory provider', () => {
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
    assertEquals(instance.fp, {})
  })

  await t.step('should throw an error when the provider is not registered', () => {
    class Provider {}
    assertThrows(
      () => new Container().resolve(Provider),
      { message: `The provider ${Provider.name} is not registered` }
    )
  })
})
