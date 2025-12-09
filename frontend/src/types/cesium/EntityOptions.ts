import type { Cartesian3, Color } from "cesium"

/**
 * 实体配置通用类型
 * 支持点、线、面、Billboard 等基础实体
 */
export interface EntityOptions {
  id: string // 实体唯一标识（必填，用于后续查询/删除）
  position: Cartesian3 | [number, number, number] // 位置（经纬度高程数组 或 Cartesian3）
  type: 'point' | 'polyline' | 'billboard' | 'polygon' // 实体类型
  default?: boolean // 是否是默认的实体，默认值false
  // 点配置（type='point' 时必填）
  pointOptions?: {
    color?: Color // 颜色（默认：红色）
    pixelSize?: number // 像素大小（默认：8）
    outlineColor?: Color // 轮廓颜色（默认：白色）
    outlineWidth?: number // 轮廓宽度（默认：1）
  }
  // 线配置（type='polyline' 时必填）
  polylineOptions?: {
    positions: Cartesian3[] | [number, number, number][] // 线顶点数组
    color?: Color // 颜色（默认：蓝色）
    width?: number // 线宽（默认：3）
    clampToGround?: boolean // 是否贴地（默认：false）
  }
  // Billboard 配置（type='billboard' 时必填）
  billboardOptions?: {
    image: string // 图片地址
    scale?: number // 缩放比例（默认：1）
    color?: Color // 颜色（默认：白色）
    verticalOrigin?: number // 垂直对齐方式（默认：CENTER）
    horizontalOrigin?: number // 水平对齐方式（默认：CENTER）
  }
  // 面配置（type='polygon' 时必填）
  polygonOptions?: {
    hierarchy: Cartesian3[] | [number, number, number][]  // 面顶点数组
    color?: Color // 颜色（默认：绿色）
    outline?: boolean // 是否显示轮廓（默认：true）
    outlineColor?: Color // 轮廓颜色（默认：黑色）
    outlineWidth?: number // 轮廓宽度（默认：1）
    height?: number // 高度（默认：0）
    extrudedHeight?: number //  extrudedHeight 高度（默认：0）
    perPositionHeight?: boolean // 是否每个顶点高度不同（默认：true）
  }
  attributes?: Record<string, unknown> // 自定义属性（用于存储额外信息）
}
