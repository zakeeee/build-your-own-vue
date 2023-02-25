import { describe, expect, test } from 'vitest';
import { effect } from './effect.js';
import { reactive, shallowReactive } from './reactive';

describe('effect', () => {
  test('effect应该触发', () => {
    const obj = reactive({ foo: 1 });

    let cnt = 0;
    effect(() => {
      console.log(obj.foo);
      cnt++;
    });

    obj.foo++;
    expect(cnt).toBe(2);
  });

  test('NaN不触发', () => {
    const obj = reactive({ foo: NaN });

    let cnt = 0;
    effect(() => {
      console.log(obj.foo);
      cnt++;
    });

    obj.foo = NaN;
    expect(cnt).toBe(1);
  });

  test('浅响应', () => {
    const obj = shallowReactive({
      foo: {
        bar: 1,
      },
    });

    let cnt = 0;
    effect(() => {
      console.log(obj.foo.bar);
      cnt++;
    });

    obj.foo.bar = 2;
    expect(cnt).toBe(1);
    obj.foo = { bar: 2 };
    expect(cnt).toBe(2);
  });

  test('深响应', () => {
    const obj = reactive({
      foo: {
        bar: 1,
      },
    });

    let cnt = 0;
    effect(() => {
      console.log(obj.foo.bar);
      cnt++;
    });

    obj.foo.bar = 2;
    expect(cnt).toBe(2);
    obj.foo = { bar: 2 };
    expect(cnt).toBe(3);
  });

  test('effect中分支切换', () => {
    const obj = reactive({ ok: true, text: 'hello world' });

    let cnt = 0;
    effect(() => {
      console.log(obj.ok ? obj.text : 'not');
      cnt++;
    });

    expect(cnt).toBe(1);
    obj.ok = false;
    expect(cnt).toBe(2);
    obj.text = 'hello vue3';
    expect(cnt).toBe(2);
  });

  test('effect嵌套，修改外层依赖，两个effect都执行', () => {
    const obj = reactive({ foo: true, bar: true });

    let outerCnt = 0;
    let innerCnt = 0;
    effect(() => {
      effect(() => {
        console.log(obj.bar);
        innerCnt++;
      });
      console.log(obj.foo);
      outerCnt++;
    });

    expect(outerCnt).toBe(1);
    expect(innerCnt).toBe(1);
    obj.foo = false;
    expect(outerCnt).toBe(2);
    expect(innerCnt).toBe(2);
  });

  test('effect嵌套，修改内层依赖，只执行内层effect', () => {
    const obj = reactive({ foo: true, bar: true });

    let outerCnt = 0;
    let innerCnt = 0;
    effect(() => {
      effect(() => {
        console.log(obj.bar);
        innerCnt++;
      });
      console.log(obj.foo);
      outerCnt++;
    });

    expect(outerCnt).toBe(1);
    expect(innerCnt).toBe(1);
    obj.bar = false;
    expect(outerCnt).toBe(1);
    expect(innerCnt).toBe(2);
  });

  test('避免无限递归', () => {
    const obj = reactive({ foo: 1 });

    let cnt = 0;
    effect(() => {
      obj.foo++;
      cnt++;
    });

    expect(cnt).toBe(1);
  });

  test('调度', () => {
    const obj = reactive({ foo: 1 });

    const arr: number[] = [];
    effect(
      () => {
        arr.push(obj.foo);
      },
      {
        scheduler: (fn) => {
          setTimeout(() => {
            fn();
            expect(arr).toEqual([1, 3, 2]);
          });
        },
      }
    );
    obj.foo++;
    arr.push(3);
  });

  test('array通过索引修改内容或修改数组长度', () => {
    const arr = reactive([1, 2, 3]);
    expect(arr.length).toBe(3);

    let cnt = 0;
    effect(() => {
      console.log(arr[0]);
      cnt++;
    });

    expect(cnt).toBe(1);
    arr[0] = 2; // 影响arr[0]，应该触发副作用
    expect(cnt).toBe(2);
    arr[3] = 4; // 不影响arr[0]，不应该触发副作用
    expect(cnt).toBe(2);
    arr.length = 2; // 不影响arr[0]，不应该触发副作用
    expect(cnt).toBe(2);
    arr.length = 0; // 影响arr[0]，应该触发副作用
    expect(cnt).toBe(3);
  });

  test('array长度', () => {
    const arr = reactive([1, 2, 3]);
    expect(arr.length).toBe(3);

    let cnt = 0;
    effect(() => {
      console.log(arr.length);
      cnt++;
    });

    expect(cnt).toBe(1);
    arr[0] = 2; // 不影响arr.length，不应该触发副作用
    expect(cnt).toBe(1);
    arr[3] = 4; // 影响arr.length，应该触发副作用
    expect(cnt).toBe(2);
    arr.length = 0; // 影响arr.length，应该触发副作用
    expect(cnt).toBe(3);
  });

  test('array for...in 循环', () => {
    const arr = reactive([1, 2, 3]);
    expect(arr.length).toBe(3);

    let cnt = 0;
    effect(() => {
      for (const key in arr) {
        console.log(key);
      }
      cnt++;
    });

    expect(cnt).toBe(1);
    arr[0] = 2; // 不影响arr.length，不应该触发副作用
    expect(cnt).toBe(1);
    arr[3] = 4; // 影响arr.length，应该触发副作用
    expect(cnt).toBe(2);
    arr.length = 0; // 影响arr.length，应该触发副作用
    expect(cnt).toBe(3);
  });

  test('array for...of 循环', () => {
    const arr = reactive([1, 2, 3]);

    let cnt = 0;
    effect(() => {
      for (const item of arr) {
        console.log(item);
      }
      cnt++;
    });

    expect(cnt).toBe(1);
    arr[0] = 2;
    expect(cnt).toBe(2);
    arr[3] = 4;
    expect(cnt).toBe(3);
    arr.length = 0;
    expect(cnt).toBe(4);
  });

  test('array includes', () => {
    const arr = reactive([1, 2, 3]);

    let cnt = 0;
    effect(() => {
      console.log(arr.includes(arr[0]));
      console.log(arr.indexOf(arr[1]));
      console.log(arr.lastIndexOf(arr[1]));
      cnt++;
    });

    expect(cnt).toBe(1);
    arr[0] = 2;
    expect(cnt).toBe(2);
    arr[3] = 4;
    expect(cnt).toBe(3);
    arr.length = 0;
    expect(cnt).toBe(4);
  });

  test('array push', () => {
    const arr = reactive([1, 2, 3]);

    let cnt = 0;
    effect(() => {
      arr.push(1);
      cnt++;
    });

    effect(() => {
      arr.push(1);
      cnt++;
    });

    expect(cnt).toBe(2);
    expect(arr.length).toBe(5);
    expect(arr[3]).toBe(1);
    expect(arr[4]).toBe(1);
  });
});
