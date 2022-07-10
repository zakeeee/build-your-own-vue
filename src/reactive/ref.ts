import { reactive } from './reactive'

type RefObject<T> = { value: T } & { __v_isRef: true }

export function ref<T>(value: T): RefObject<T> {
  const wrapper = {
    value,
  }

  // 用__v_isRef区分是ref和reactive
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true,
  })

  return reactive(wrapper) as RefObject<T>
}

export function toRef<T extends object, K extends keyof T>(obj: T, key: K): RefObject<T[K]> {
  const wrapper = {
    get value() {
      return obj[key]
    },
    set value(val) {
      obj[key] = val
    },
  }

  Object.defineProperty(wrapper, '__v_isRef', {
    value: true,
  })

  return wrapper as RefObject<T[K]>
}

export function toRefs<T extends object>(obj: T): { [k in keyof T]: RefObject<T[k]> } {
  const ret: any = {}
  for (const key in obj) {
    ret[key] = toRef(obj, key)
  }
  return ret
}

export function proxyRefs<T extends object>(target: T): { [k in keyof T]: T[k] extends RefObject<infer R> ? R : T[k] } {
  return new Proxy<any>(target, {
    get(target, p, receiver) {
      const res = Reflect.get(target, p, receiver)

      return res.__v_isRef ? res.value : res
    },
    set(target, p, value, receiver) {
      const res = target[p]

      if (res.__v_isRef) {
        res.value = value
        return true
      }

      return Reflect.set(target, p, value, receiver)
    },
  })
}
