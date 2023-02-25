import { effect } from './effect';

interface WatchOptions {
  immediate?: boolean;
  flush?: 'sync' | 'pre' | 'post';
}

type WatchCallback<T> = (
  newValue: T,
  oldValue: T | undefined,
  onInvalidate: (fn: () => void) => void
) => void;

export function watch<T>(source: T | (() => T), cb: WatchCallback<T>, options: WatchOptions = {}) {
  let getter: () => T;
  if (typeof source === 'function') {
    // @ts-ignore
    getter = source;
  } else {
    getter = () => traverse(source);
  }

  let cleanup: (() => void) | undefined;
  function onInvalidate(fn: () => void) {
    cleanup = fn;
  }

  let oldValue: T | undefined;
  let newValue: T;

  const job = () => {
    newValue = effectFn();
    if (cleanup) {
      cleanup();
    }
    cb(newValue, oldValue, onInvalidate);
    oldValue = newValue;
  };

  const effectFn = effect(() => getter(), {
    lazy: true,
    scheduler: () => {
      if (options.flush === 'post') {
        Promise.resolve().then(job);
      } else {
        job();
      }
    },
  });

  if (options.immediate) {
    job();
  } else {
    oldValue = effectFn();
  }
}

function traverse(value: any, seen = new Set()) {
  // 暂时只考虑object
  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return;
  }

  seen.add(value);
  for (const k in value) {
    traverse(value[k], seen);
  }

  return value;
}
