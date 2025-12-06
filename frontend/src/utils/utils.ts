/**
 * 工具类集合
 * 包含防抖等通用工具函数（无显式any类型）
 */
export const Utils = {
  /**
   * 防抖函数
   * @param func - 需要防抖的函数
   * @param delay - 延迟时间（毫秒），默认500ms
   * @param immediate - 是否立即执行，默认false
   * @returns 防抖处理后的函数
   */
  debounce: function <This, T extends unknown[], R = void>(
    func: (this: This, ...args: T) => R,
    delay: number = 500,
    immediate: boolean = false,
  ) {
    let timer: number | null = null

    // 用泛型This指定this类型
    return function (this: This, ...args: T): void {
      if (timer) clearTimeout(timer)

      // 立即执行逻辑
      if (immediate && !timer) {
        func.apply(this, args)
      }

      // 重新设置定时器
      timer = window.setTimeout(() => {
        if (!immediate) {
          func.apply(this, args)
        }
        timer = null
      }, delay)
    }
  },
}
