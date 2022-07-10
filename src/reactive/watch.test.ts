import { describe, expect, test } from 'vitest'
import { reactive } from './reactive'
import { watch } from './watch'

describe('watch', () => {
  test('依赖变化时watch应该执行', () => {
    const obj = reactive({ foo: 1, bar: 2 })

    let a = 0
    watch(obj, () => {
      a++
    })
    obj.foo = 2
    expect(a).toBe(1)
  })

  test('watch立即执行', () => {
    const obj = reactive({ foo: 1, bar: 2 })

    let a = 0
    watch(
      obj,
      () => {
        a++
      },
      {
        immediate: true,
      }
    )
    expect(a).toBe(1)
  })

  test('watch回调新旧值', () => {
    const obj = reactive({ foo: 1, bar: 2 })

    let oldVal
    let newVal
    watch(
      () => obj.foo,
      (newValue, oldValue) => {
        oldVal = oldValue
        newVal = newValue
      }
    )

    obj.foo = 2
    expect(oldVal).toBe(1)
    expect(newVal).toBe(2)
  })

  test('watch过期effect处理', async () => {
    const obj = reactive({ foo: 1 })

    let i = 0
    let timeout = 128
    const func = () => {
      return new Promise((resolve) => {
        const tmp = i
        i++
        timeout = 0
        setTimeout(() => {
          resolve(tmp)
        }, timeout)
      })
    }

    let a
    await new Promise<void>((resolve) => {
      let i = 0
      watch(obj, async (newValue, oldValue, onInvalidate) => {
        let expired = false
        onInvalidate(() => {
          expired = true
        })

        const res = await func()
        if (!expired) {
          a = res
        }
        if (++i > 1) {
          resolve()
        }
      })

      obj.foo++
      obj.foo++
    })

    expect(a).toBe(1)
  })
})
