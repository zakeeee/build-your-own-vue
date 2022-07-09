import { track, trigger } from './effect'

export function toProxy<T extends object>(obj: T): T {
  return new Proxy<T>(obj, {
    get(target, p, receiver) {
      track(target, p)
      // @ts-ignore
      return target[p]
    },
    set(target, p, value, receiver) {
      // @ts-ignore
      target[p] = value
      trigger(target, p)
      return true
    },
  })
}
