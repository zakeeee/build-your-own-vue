import { describe, expect, test } from 'vitest';
import { effect } from './effect';
import { reactive } from './reactive';
import { proxyRefs, ref, toRefs } from './ref';

describe('ref', () => {
  test('ref', () => {
    const a = ref(1);

    let cnt = 0;
    effect(() => {
      console.log(a.value);
      cnt++;
    });

    a.value = 2;
    expect(a.value).toBe(2);
    expect(cnt).toBe(2);
  });

  test('脱ref', () => {
    const obj = reactive({ foo: 1, bar: 2 });
    const refObj = { ...toRefs(obj) };
    const deRefObj = proxyRefs(refObj);

    let cnt = 0;
    effect(() => {
      console.log(deRefObj.foo);
      cnt++;
    });

    deRefObj.foo = 2;
    expect(deRefObj.foo).toBe(2);
    expect(cnt).toBe(2);
    refObj.foo.value = 3;
    expect(deRefObj.foo).toBe(3);
    expect(cnt).toBe(3);
  });
});
