import { describe, expect, test } from 'vitest'
import { reactive, shallowReactive } from './reactive'

describe('reactive', () => {
  test('reactive object', () => {
    const originObj = {
      foo: 1,
      bar: {
        a: 1,
        b: 2,
      },
    }
    const obj = reactive(originObj)
    expect(obj.foo).toBe(1)
    expect(obj.bar.a).toBe(1)
    obj.foo = 2
    expect(obj.foo).toBe(2)
    obj.bar.a = 2
    expect(obj.bar.a).toBe(2)

    const obj2 = reactive(originObj)
    expect(obj).toBe(obj2)
  })

  test('shallow reactive object', () => {
    const originObj = {
      foo: 1,
      bar: {
        a: 1,
        b: 2,
      },
    }
    const obj = shallowReactive(originObj)
    expect(obj.foo).toBe(1)
    expect(obj.bar.a).toBe(1)
    obj.foo = 2
    expect(obj.foo).toBe(2)
    obj.bar.a = 2
    expect(obj.bar.a).toBe(2)

    const obj2 = shallowReactive(originObj)
    expect(obj).toBe(obj2)
  })

  test('reactive array', () => {
    const obj = { value: 2 }
    const arr = reactive([1, obj, 3])
    expect(arr.length).toBe(3)
    expect(arr.includes(obj)).toBe(true)
    expect(arr.includes(arr[0])).toBe(true)
    expect(arr.indexOf(arr[0])).toBe(0)
    expect(arr.lastIndexOf(arr[0])).toBe(0)
  })
})
