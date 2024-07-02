export function withResolvers<T = void>() {
  let $resolve: (value: T | PromiseLike<T>) => void
  let $reject: (reason?: any) => void

  return {
    promise: new Promise<T>((resolve, reject) => {
      $resolve = resolve
      $reject = reject
    }),
    resolve: $resolve!,
    reject: $reject!,
  }
}
