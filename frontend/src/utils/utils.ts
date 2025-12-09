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

  formatDate: (format: string, date: Date = new Date()): string => {
    // 基础时间数据
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // 月份0-11，需+1
    const day = date.getDate()
    const hours24 = date.getHours()
    const hours12 = hours24 % 12 || 12 // 12小时制处理（0→12）
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()
    const weekNum = date.getDay() // 星期0-6（0=周日）

    // 星期映射配置
    const weekMaps = {
      ddd: ['日', '一', '二', '三', '四', '五', '六'].map((day) => `星期${day}`),
      dd: ['日', '一', '二', '三', '四', '五', '六'].map((day) => `周${day}`),
      d: [0, 1, 2, 3, 4, 5, 6],
    }

    // 占位符替换规则（顺序：长占位符优先，避免冲突）
    const replaceRules = [
      { regex: /YYYY/g, value: year.toString() },
      { regex: /YY/g, value: year.toString().slice(-2) },
      { regex: /MM/g, value: month.toString().padStart(2, '0') },
      { regex: /M/g, value: month.toString() },
      { regex: /DD/g, value: day.toString().padStart(2, '0') },
      { regex: /D/g, value: day.toString() },
      { regex: /HH/g, value: hours24.toString().padStart(2, '0') },
      { regex: /H/g, value: hours24.toString() },
      { regex: /hh/g, value: hours12.toString().padStart(2, '0') },
      { regex: /h/g, value: hours12.toString() },
      { regex: /mm/g, value: minutes.toString().padStart(2, '0') },
      { regex: /m/g, value: minutes.toString() },
      { regex: /ss/g, value: seconds.toString().padStart(2, '0') },
      { regex: /s/g, value: seconds.toString() },
      { regex: /ddd/g, value: weekMaps.ddd[weekNum] },
      { regex: /dd/g, value: weekMaps.dd[weekNum] },
      { regex: /d/g, value: weekMaps.d[weekNum] },
    ]

    // 执行替换
    return replaceRules.reduce((result, { regex, value }) => {
      return result.replace(regex, String(value ?? ''))
    }, format)
  },
  /**
   * 深拷贝函数
   * 支持类型：原始类型、数组、对象、Date、RegExp、Map、Set、ArrayBuffer等
   * @param source 要拷贝的数据源
   * @param hash 用于解决循环引用的哈希表，内部使用
   * @returns 深拷贝后的新数据
   */
  deepClone: <T>(source: T, hash = new WeakMap<object, unknown>()): T => {
    // 处理 null 或 undefined
    if (source === null || source === undefined) {
      return source
    }

    // 处理原始类型（string, number, boolean, symbol, bigint, function）
    if (typeof source !== 'object' && typeof source !== 'function') {
      return source
    }

    // 处理函数 - 直接返回原函数引用（通常不需要克隆函数）
    if (typeof source === 'function') {
      return source
    }

    // 解决循环引用
    if (hash.has(source)) {
      return hash.get(source) as T
    }

    // 处理 Date 对象
    if (source instanceof Date) {
      const cloned = new Date(source.getTime()) as T
      hash.set(source, cloned)
      return cloned
    }

    // 处理 RegExp 对象
    if (source instanceof RegExp) {
      const cloned = new RegExp(source.source, source.flags)
      cloned.lastIndex = source.lastIndex // 安全访问
      return cloned as unknown as T
    }
    // 处理 Map 对象
    if (source instanceof Map) {
      const cloned = new Map()
      hash.set(source, cloned)
      source.forEach((value, key) => {
        cloned.set(Utils.deepClone(key, hash), Utils.deepClone(value, hash))
      })
      return cloned as T
    }

    // 处理 Set 对象
    if (source instanceof Set) {
      const cloned = new Set<unknown>()
      hash.set(source, cloned)
      for (const value of source.values()) {
        cloned.add(Utils.deepClone(value, hash))
      }
      return cloned as T
    }

    // 处理 ArrayBuffer
    if (source instanceof ArrayBuffer) {
      const cloned = source.slice(0) as T
      hash.set(source, cloned)
      return cloned
    }

    // 处理数组
    if (Array.isArray(source)) {
      const cloned: T[] = []
      hash.set(source, cloned)
      for (let i = 0; i < source.length; i++) {
        cloned[i] = Utils.deepClone(source[i], hash)
      }
      return cloned as T
    }

    // 处理普通对象
    if (typeof source === 'object') {
      // 处理 Error 对象
      if (source instanceof Error) {
        const cloned = new Error(source.message)
        cloned.stack = source.stack
        cloned.name = source.name
        hash.set(source, cloned)
        return cloned as T
      }

      // 处理其他对象
      const cloned: { [key: string | symbol]: unknown } = {}
      hash.set(source, cloned)

      // 获取对象的所有属性（包括不可枚举的属性和 Symbol）
      const keys = [...Object.getOwnPropertyNames(source), ...Object.getOwnPropertySymbols(source)]

      for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(source, key)

        // 如果是访问器属性
        if (descriptor && descriptor.get) {
          Object.defineProperty(cloned, key, descriptor)
        } else {
          // 如果是数据属性
          cloned[key] = Utils.deepClone((source as { [key: string | symbol]: unknown })[key], hash)
        }
      }

      // 处理原型链
      const proto = Object.getPrototypeOf(source)
      if (proto && proto !== Object.prototype) {
        Object.setPrototypeOf(cloned, proto)
      }

      return cloned as T
    }

    // 对于其他无法处理的情况，返回原值
    return source
  },
}
