import { describe, expect, test } from 'vitest'
import { computed } from './computed'
import { effect } from './effect'
import { reactive } from './reactive'

describe('computed', () => {
  test('computed', () => {
    const obj = reactive({ foo: 1, bar: 2 })

    const a = computed(() => obj.foo + obj.bar)
    expect(a.value).toBe(3)

    let b = 0
    effect(() => {
      b = a.value
    })
    expect(b).toBe(3)
    obj.foo = 2
    expect(b).toBe(4)
  })
})
