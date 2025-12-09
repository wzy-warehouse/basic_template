import type { Cartesian3, Color } from 'cesium'

export interface PrimitiveOptions {
  id: string
  type: 'point' | 'polyline' | 'polygon' | 'billboard'
  positions: [number, number, number][] | Cartesian3[] // 点集合，线和面需要多个点
  default?: boolean // 是否是默认的图元，默认值false
  color?: Color
  pixelSize?: number // 点大小
  width?: number // 线宽
  image?: string // 广告牌图片
  scale?: number // 广告牌缩放
}
