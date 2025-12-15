import type { Color } from 'cesium'
import type { labelConfig } from './LabelConfig'

export interface GeoJsonType {
  layerId: string // 图层id
  geojsonData: object | string // geojson数据
  style?: {
    pointColor?: Color // 点颜色
    lineColor?: Color // 线颜色
    polygonColor?: Color // 面颜色
    lineWidth?: number // 线宽
  }
  labelEnabled?: boolean // 是否显示标签，默认false
  label?: labelConfig   // 标签配置
}
