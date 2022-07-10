import { ITERATE_KEY } from './reactive'

interface EffectOptions<T> {
  lazy?: boolean
  scheduler?: (fn: EffectFunc<T>) => void
}

interface EffectFunc<T = any> {
  (): T
  deps: Set<EffectFunc>[]
  options: EffectOptions<T>
}

export enum TriggerType {
  SET = 'SET',
  ADD = 'ADD',
  DELETE = 'DELETE',
}

const _arrayInstrumentations: any = {}
;['includes', 'indexOf', 'lastIndexOf'].forEach((method) => {
  // this是代理对象

  // @ts-ignore
  const originMethod = Array.prototype[method]
  _arrayInstrumentations[method] = function (...args: unknown[]) {
    let res = originMethod.apply(this, args)

    if (res === false) {
      res = originMethod.apply(this.raw, args)
    }

    return res
  }
})

let shouldTrack = true
;['push', 'pop', 'shift', 'unshift', 'splice'].forEach((method) => {
  // this是代理对象

  // @ts-ignore
  const originMethod = Array.prototype[method]
  _arrayInstrumentations[method] = function (...args: unknown[]) {
    shouldTrack = false
    let res = originMethod.apply(this, args)
    shouldTrack = true
    return res
  }
})

export const arrayInstrumentations = _arrayInstrumentations

let activeEffect: EffectFunc | undefined = undefined // 当前正在执行的副作用函数
const effectStack: EffectFunc[] = [] // 副作用函数栈，用于处理副作用函数嵌套的情况
const bucket = new WeakMap<object, Map<string | symbol, Set<EffectFunc>>>()

export function effect<T>(fn: () => T, options: EffectOptions<T> = {}) {
  const effectFn: EffectFunc<T> = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    effectStack.push(effectFn)
    const res = fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }

  effectFn.options = options
  effectFn.deps = []

  // 如果设置了lazy不执行
  if (!options.lazy) {
    effectFn()
  }
  return effectFn
}

export function track<T extends object>(target: T, key: string | symbol) {
  if (!activeEffect || !shouldTrack) {
    return
  }

  let depsMap = bucket.get(target)
  if (!depsMap) {
    depsMap = new Map()
    bucket.set(target, depsMap)
  }

  let deps = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }

  deps.add(activeEffect)
  activeEffect.deps.push(deps)
}

export function trigger<T extends object>(target: T, key: string | symbol, type?: TriggerType, newVal?: unknown) {
  const depsMap = bucket.get(target)
  if (!depsMap) {
    return
  }

  const effectsToRun = new Set<EffectFunc<T>>()

  const effects = depsMap.get(key)
  if (effects) {
    effects.forEach((effectFn) => {
      // 如果effectFn是当前正在执行的副作用函数，就不要再触发执行了，不然会导致无限递归
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })
  }

  if (type === TriggerType.ADD || type === TriggerType.DELETE) {
    const effects = depsMap.get(ITERATE_KEY)
    if (effects) {
      effects.forEach((effectFn) => {
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn)
        }
      })
    }
  }

  if (type === TriggerType.ADD && Array.isArray(target)) {
    const effects = depsMap.get('length')
    if (effects) {
      effects.forEach((effectFn) => {
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn)
        }
      })
    }
  }

  if (Array.isArray(target) && key === 'length') {
    depsMap.forEach((effects, key1) => {
      if (Number(key1) >= (newVal as number)) {
        effects.forEach((effectFn) => {
          if (effectFn !== activeEffect) {
            effectsToRun.add(effectFn)
          }
        })
      }
    })
  }

  effectsToRun.forEach((effectFn) => {
    if (effectFn.options.scheduler) {
      // 如果副作用函数指定了调度器，使用调度器去调度
      effectFn.options.scheduler(effectFn)
    } else {
      // 否则直接执行
      effectFn()
    }
  })
}

function cleanup(effectFn: EffectFunc) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    effectFn.deps[i].delete(effectFn)
  }
  effectFn.deps = []
}
