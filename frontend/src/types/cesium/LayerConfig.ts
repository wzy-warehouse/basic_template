export interface LayerConfig {
  id: string        // 唯一id

  type: 'imagery' | 'wms' | 'wmts'    // 图层类型，支持iimagery, Geoserver WMS, Geoserver WMTS
  provider: string  // 图层提供者
  url: string     // 图层地址
  layers: string  // 图层名称

  default?: boolean     // 是否是默认图层，默认值false

  /**
   * WMTS 图层参数
   */
  style?: string  // 图层样式，默认为default
  format?: string  // 图层格式，默认为image/png
  tileMatrixSetID?: string  // 瓦片矩阵集ID，默认为EPSG:4326
  credit?: string  // 图层版权信息，默认为空


  parameters?: Record<string, string> // 图层参数
}
