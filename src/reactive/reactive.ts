import { DeepReadonly } from '@/utils/types'
import { arrayInstrumentations, track, trigger, TriggerType } from './effect'

export const ITERATE_KEY = Symbol()

function createReactive<T extends object>(obj: T, isShallow = false, isReadonly = false): T {
  return new Proxy<T>(obj, {
    get(target, p, receiver) {
      if (p === 'raw') {
        return target
      }

      if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(p)) {
        return Reflect.get(arrayInstrumentations, p, receiver)
      }

      if (!isReadonly && typeof p !== 'symbol') {
        track(target, p)
      }

      const res = Reflect.get(target, p, receiver)
      if (isShallow) {
        return res
      }

      if (typeof res === 'object' && res !== null) {
        return isReadonly ? readonly(res) : reactive(res)
      }

      return res
    },
    set(target, p, newVal, receiver) {
      if (isReadonly) {
        console.warn(`property ${p.toString()} is readonly`)
        return true
      }

      // @ts-ignore
      const oldVal = target[p]

      // 触发类型可能是设置值或者是添加属性
      let triggerType: TriggerType
      if (Array.isArray(target)) {
        triggerType = Number(p) < target.length ? TriggerType.SET : TriggerType.ADD
      } else {
        triggerType = Object.prototype.hasOwnProperty.call(target, p) ? TriggerType.SET : TriggerType.ADD
      }

      const res = Reflect.set(target, p, newVal, receiver)

      if (target === receiver.raw) {
        // receiver是target的代理对象

        if (
          oldVal !== newVal &&
          // 处理NaN的情况，因为NaN !== NaN
          (oldVal === oldVal || newVal === newVal)
        ) {
          trigger(target, p, triggerType, newVal)
        }
      }
      return res
    },
    ownKeys(target) {
      const key = Array.isArray(target) ? 'length' : ITERATE_KEY
      track(target, key)
      return Reflect.ownKeys(target)
    },
    deleteProperty(target, p) {
      if (isReadonly) {
        console.warn(`property ${p.toString()} is readonly`)
        return true
      }

      const hasOwnProperty = Object.prototype.hasOwnProperty.call(target, p)
      const res = Reflect.deleteProperty(target, p)
      if (res && hasOwnProperty) {
        trigger(target, p, TriggerType.DELETE)
      }
      return res
    },
  })
}

const reactiveMap = new WeakMap()
export function reactive<T extends object>(obj: T): T {
  // 避免对同一个对象创建不同的代理对象
  const existProxy = reactiveMap.get(obj)
  if (existProxy) {
    return existProxy
  }

  const proxy = createReactive(obj)
  reactiveMap.set(obj, proxy)

  return proxy
}

const shallowReactiveMap = new WeakMap()
export function shallowReactive<T extends object>(obj: T): T {
  // 避免对同一个对象创建不同的代理对象
  const existProxy = shallowReactiveMap.get(obj)
  if (existProxy) {
    return existProxy
  }

  const proxy = createReactive(obj, true)
  shallowReactiveMap.set(obj, proxy)

  return proxy
}

const readonlyMap = new WeakMap()
export function readonly<T extends object>(obj: T): DeepReadonly<T> {
  // 避免对同一个对象创建不同的代理对象
  const existProxy = readonlyMap.get(obj)
  if (existProxy) {
    return existProxy
  }

  const proxy = createReactive(obj, false, true) as DeepReadonly<T>
  readonlyMap.set(obj, proxy)

  return proxy
}

const shallowReadonlyMap = new WeakMap()
export function shallowReadonly<T extends object>(obj: T): Readonly<T> {
  // 避免对同一个对象创建不同的代理对象
  const existProxy = shallowReadonlyMap.get(obj)
  if (existProxy) {
    return existProxy
  }

  const proxy = createReactive(obj, true, true)
  shallowReadonlyMap.set(obj, proxy)

  return proxy
}
