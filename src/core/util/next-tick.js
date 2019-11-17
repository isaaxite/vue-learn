/* @flow */
/* globals MutationObserver */

import { noop } from 'shared/util'
import { handleError } from './error'
import { isIE, isIOS, isNative } from './env'

export let isUsingMicroTask = false

const callbacks = []
let pending = false

function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

// Here we have async deferring wrappers using microtasks.
// In 2.5 we used (macro) tasks (in combination with microtasks).
// However, it has subtle problems when state is changed right before repaint
// (e.g. #6813, out-in transitions).
// Also, using (macro) tasks in event handler would cause some weird behaviors
// that cannot be circumvented (e.g. #7109, #7153, #7546, #7834, #8109).
// So we now use microtasks everywhere, again.
// A major drawback of this tradeoff is that there are some scenarios
// where microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690, which have workarounds)
// or even between bubbling of the same event (#6566).

// 这里我们使用微任务异步延迟包装器。在2.5中，我们使用了（宏）任务（与微任务结合使用），
// 但是当重新绘制之前状态发生改变时它存在一些细微的问题（例如＃6813，输出转换）。
//  在事件处理程序中使用（宏）任务会导致一些无法避免的怪异行为（例如＃7109，＃7153，＃7546，＃7834，＃8109）。
// 因此，我们现在再次在各处使用微任务。 是在某些情况下，微任务的优先级过高，
// 并且在假定的顺序事件之间（例如＃4521，＃6690，它们具有变通方法）甚至在同一事件冒泡之间也会触发（＃6566）。
let timerFunc

// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:

// nextTick行为利用了微任务队列，该微任务队列可通过本机Promise.then或MutationObserver进行访问。
// MutationObserver具有更广泛的支持，但是在触摸事件处理程序中触发时，iOS> = 9.3.3中的UIWebView严重出错。 
// 触发几次后，它将完全停止工作...因此，如果本地Promise可用，我们将使用它。
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    // 在有问题的UIWebViews中，Promise.then并不会完全中断，但是它可能会陷入一种怪异的状态，
    // 在这种状态中，回调被推送到微任务队列中，但是队列没有被刷新，直到浏览器需要执行其他一些工作，
    // 例如 处理一个计时器。 因此，我们可以通过添加空计时器来“强制”刷新微任务队列。
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  // 在本地Promise不可用的地方使用MutationObserver，
  // e.g. PhantomJS, iOS7, Android 4.4
  // （＃6466 MutationObserver在IE11中不可靠）
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Techinically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  // 退回到setImmediate。
  // 从技术上讲，它利用（宏）任务队列，
  // 但它仍然是比setTimeout更好的选择。
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
