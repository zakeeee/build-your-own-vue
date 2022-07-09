import { effect, track, trigger } from './effect'

export function computed<T>(getter: () => T) {
  let cachedValue: T
  let dirty = true

  const effectFn = effect(getter, {
    lazy: true,
    scheduler: () => {
      if (!dirty) {
        dirty = true
        trigger(obj, 'value')
      }
    },
  })

  const obj = {
    get value() {
      if (dirty) {
        cachedValue = effectFn()
        dirty = false
      }
      track(obj, 'value')
      return cachedValue
    },
  }

  return obj
}
