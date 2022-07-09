import { describe, expect, test } from 'vitest'
import { effect } from './effect.js'
import { toProxy } from './proxy.js'

describe('effect', () => {
  test('effect应该触发', () => {
    const obj = toProxy({ foo: 1 })

    let flag = false
    effect(() => {
      flag = true
    })

    obj.foo++
    expect(flag).toBe(true)
  })

  test('effect中分支切换', () => {
    const obj = toProxy({ ok: true, text: 'hello world' })

    let cnt = 0
    effect(() => {
      console.log(obj.ok ? obj.text : 'not')
      cnt++
    })

    expect(cnt).toBe(1)
    obj.ok = false
    expect(cnt).toBe(2)
    obj.text = 'hello vue3'
    expect(cnt).toBe(2)
  })

  test('effect嵌套，修改外层依赖，两个effect都执行', () => {
    const obj = toProxy({ foo: true, bar: true })

    let outerCnt = 0
    let innerCnt = 0
    effect(() => {
      effect(() => {
        console.log(obj.bar)
        innerCnt++
      })
      console.log(obj.foo)
      outerCnt++
    })

    expect(outerCnt).toBe(1)
    expect(innerCnt).toBe(1)
    obj.foo = false
    expect(outerCnt).toBe(2)
    expect(innerCnt).toBe(2)
  })

  test('effect嵌套，修改内层依赖，只执行内层effect', () => {
    const obj = toProxy({ foo: true, bar: true })

    let outerCnt = 0
    let innerCnt = 0
    effect(() => {
      effect(() => {
        console.log(obj.bar)
        innerCnt++
      })
      console.log(obj.foo)
      outerCnt++
    })

    expect(outerCnt).toBe(1)
    expect(innerCnt).toBe(1)
    obj.bar = false
    expect(outerCnt).toBe(1)
    expect(innerCnt).toBe(2)
  })

  test('避免无限递归', () => {
    const obj = toProxy({ foo: 1 })

    let cnt = 0
    effect(() => {
      obj.foo++
      cnt++
    })

    expect(cnt).toBe(1)
  })

  test('调度', () => {
    const obj = toProxy({ foo: 1 })

    const arr: number[] = []
    effect(
      () => {
        arr.push(obj.foo)
      },
      {
        scheduler: (fn) => {
          setTimeout(() => {
            fn()
            expect(arr).toEqual([1, 3, 2])
          })
        },
      }
    )
    obj.foo++
    arr.push(3)
  })
})
