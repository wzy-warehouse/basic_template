import type { Cartesian3, Color, HorizontalOrigin, VerticalOrigin } from 'cesium'

export interface labelConfig {
  labelText?: string // 文本，默认空白
  labelFont?: string // 字体样式，默认16px "微软雅黑"
  labelColor?: Color // 标签颜色， 默认白色
  labelSize?: number // 字体大小，默认16
  labelOffset?: { x: number; y: number } // 标签偏移，默认0,0
  horizontalOrigin?: HorizontalOrigin // 水平位置，默认居中
  verticalOrigin?: VerticalOrigin // 垂直位置，默认居中
  backgroundColor?: Color // 背景颜色，默认透明
  center?: Cartesian3 | [number, number, number]
}
