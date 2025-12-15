import type { CesiumInitOptions } from '@/types/cesium/CesiumInitOptions'
import type { EntityOptions } from '@/types/cesium/EntityOptions'
import type { PrimitiveOptions } from '@/types/cesium/PrimitiveOptions'
import type { LayerConfig } from '@/types/cesium/LayerConfig'
import type { GeoJsonType } from '@/types/cesium/GeoJsonType'
import {
  Viewer,
  Entity,
  Cartesian3,
  Color,
  PointGraphics,
  PolylineGraphics,
  BillboardGraphics,
  SceneMode,
  CesiumTerrainProvider,
  EllipsoidTerrainProvider,
  VerticalOrigin,
  HorizontalOrigin,
  Cartographic,
  ColorMaterialProperty,
  Ion,
  WebMapTileServiceImageryProvider,
  ImageryProvider,
  ImageryLayer,
  Math as CesiumMath,
  PolygonHierarchy,
  PolygonGraphics,
  ConstantProperty,
  Primitive,
  BillboardCollection,
  GeometryInstance,
  CircleGeometry,
  ColorGeometryInstanceAttribute,
  PerInstanceColorAppearance,
  PolylineGeometry,
  PolylineColorAppearance,
  PolygonGeometry,
  ArcGisMapServerImageryProvider,
  WebMapServiceImageryProvider,
  DataSource,
  GeoJsonDataSource,
  LabelGraphics,
  LabelStyle,
  Cartesian2,
  JulianDate,
  ConstantPositionProperty,
} from 'cesium'
import config from '@/config/config.json'
import type { labelConfig } from '@/types/cesium/LabelConfig'

// 定义清除类型枚举
export type ClearType = 'default' | 'custom' | 'all'

/**
 * Cesium 工具类
 * 封装 Cesium 核心操作，区分默认/自定义资源管理
 */
export class CesiumUtils {
  // ===================== 定义viewer =====================
  #viewer: Viewer | null = null

  // ===================== 私有属性定义 =====================
  #defaultEntityIds = new Set<string>()
  #customEntityIds = new Set<string>()
  #defaultPrimitiveMap = new Map<string, Primitive | BillboardCollection>()
  #customPrimitiveMap = new Map<string, Primitive | BillboardCollection>()
  #defaultLayerMap = new Map<string, ImageryLayer>()
  #customLayerMap = new Map<string, ImageryLayer>()
  #defaultGeoJsonMap = new Map<string, DataSource>()
  #customGeoJsonMap = new Map<string, DataSource>()

  constructor() {
    Ion.defaultAccessToken = config.cesiumIonDefaultAccessToken
  }

  // ===================== 初始化与销毁 =====================

  /**
   * 初始化 Cesium Viewer
   */
  initCesiumViewer(options: CesiumInitOptions, tdMapToken?: string[], type: number = 0): void {
    const defaultOptions: CesiumInitOptions = {
      containerId: options.containerId,
      shouldAnimate: true,
      baseLayerPicker: false,
      timeline: false,
      animation: false,
      infoBox: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      homeButton: false,
      scene3DOnly: false,
      sceneModePicker: false,
      geocoder: false,
      sceneMode: SceneMode.SCENE3D,
    }

    const finalOptions = { ...defaultOptions, ...options }
    const container = document.getElementById(finalOptions.containerId)

    if (!container) {
      throw new Error(`Cesium 容器 #${finalOptions.containerId} 不存在`)
    }

    const viewer = new Viewer(container, {
      ...finalOptions,
      terrainProvider: finalOptions.terrain
        ? new CesiumTerrainProvider({ url: finalOptions.terrain })
        : new EllipsoidTerrainProvider(),
      contextOptions: {
        webgl: {
          alpha: true,
          depth: false,
          stencil: true,
          antialias: true,
          premultipliedAlpha: true,
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: true,
        },
        allowTextureFilterAnisotropic: true,
      },
    })

    // 性能优化配置
    viewer.scene.globe.depthTestAgainstTerrain = false
    viewer.scene.fog.enabled = false
    viewer.scene.globe.enableLighting = false
    viewer.shadows = false
    const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement
    creditContainer.style.display = 'none'

    // 添加底图
    this.imageryProvider(type, tdMapToken || config.tdMapToken).forEach((provider) => {
      viewer.imageryLayers.addImageryProvider(provider)
    })

    this.#viewer = viewer
  }

  /**
   * 销毁 Cesium Viewer
   */
  destroyCesiumViewer(): void {
    if (this.#viewer) {
      this.clearAllResources('all')
      this.#viewer.destroy()
    }
  }

  // ===================== 底图配置 =====================

  /**
   * 创建底图 ImageryProvider
   */
  private imageryProvider(type: number, tdMapToken: string[]): ImageryProvider[] {
    const option = {
      tileMatrixSetID: 'w',
      format: 'tiles',
      style: 'default',
      minimumLevel: 0,
      maximumLevel: 18,
      credit: 'Tianditu',
      subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    }

    if (type === 0) {
      const token = tdMapToken[Math.floor(Math.random() * tdMapToken.length)]
      const imageryProvider = new WebMapTileServiceImageryProvider({
        url: `https://{s}.tianditu.gov.cn/img_w/wmts?tk=${token}`,
        layer: 'img',
        ...option,
      })
      const annotationProvider = new WebMapTileServiceImageryProvider({
        url: `https://{s}.tianditu.gov.cn/cia_w/wmts?tk=${token}`,
        layer: 'cia',
        ...option,
      })
      return [imageryProvider, annotationProvider]
    } else {
      const vectorProvider = new WebMapTileServiceImageryProvider({
        url: `https://{s}.tianditu.gov.cn/vec_w/wmts?tk=cc`,
        layer: 'vec',
        ...option,
      })
      return [vectorProvider]
    }
  }

  // ===================== 实体管理 =====================

  /**
   * 添加实体
   */
  addCesiumEntity(entityOptions: EntityOptions): Entity {
    const { id, position, attributes = {}, default: isDefault = false } = entityOptions

    if (!id) throw new Error('实体 id 为必填项')
    if (!position) throw new Error('实体 position 为必填项')
    this.#validateUniqueId(id)

    const entity = new Entity({
      id,
      position: this.convertPosition(position),
      ...attributes,
    })

    this.#configureEntityGraphics(entity, entityOptions)

    this.#viewer?.entities.add(entity)
    this.#storeEntityId(id, isDefault)
    return entity
  }

  /**
   * 查询实体
   */
  getCesiumEntityById(entityId: string): Entity | null {
    if (!this.#entityExists(entityId)) return null
    return this.#viewer?.entities.getById(entityId) || null
  }

  /**
   * 删除实体
   */
  removeCesiumEntity(entityId: string): boolean {
    if (!this.#entityExists(entityId)) {
      console.warn(`实体 ID ${entityId} 不存在`)
      return false
    }

    const entity = this.#viewer?.entities.getById(entityId)
    if (entity) {
      this.#viewer?.entities.remove(entity)
      this.#removeEntityId(entityId)
      return true
    }
    return false
  }

  /**
   * 批量删除实体
   */
  batchRemoveCesiumEntities(entityIds: string[]): void {
    entityIds.forEach((id) => this.removeCesiumEntity(id))
  }

  // ===================== Primitive 管理 =====================

  /**
   * 批量添加 Primitive
   */
  addPrimitivesBatch(primitives: PrimitiveOptions[]): void {
    const grouped = this.#groupPrimitivesByType(primitives)

    if (grouped.points.length > 0) this.#addPointPrimitives(grouped.points)
    if (grouped.polylines.length > 0) this.#addPolylinePrimitives(grouped.polylines)
    if (grouped.polygons.length > 0) this.#addPolygonPrimitives(grouped.polygons)
    if (grouped.billboards.length > 0)
      this.#addBillboardPrimitives(grouped.billboards)
  }

  /**
   * 查询 Primitive
   */
  getPrimitiveById(id: string): Primitive | BillboardCollection | undefined {
    return this.#defaultPrimitiveMap.get(id) || this.#customPrimitiveMap.get(id)
  }

  /**
   * 删除 Primitive
   */
  removePrimitiveById(id: string): boolean {
    const { isDefault, primitive } = this.#getPrimitiveInfo(id)
    if (!primitive) {
      console.warn(`Primitive ID ${id} 不存在`)
      return false
    }

    this.#viewer?.scene.primitives.remove(primitive)
    this.#removePrimitiveId(id, isDefault)
    return true
  }

  // ===================== 图层管理 =====================

  /**
   * 创建图层
   */
  createLayer(layerConfig: LayerConfig): ImageryLayer | null {
    const { layers: layerKey, default: isDefault = false } = layerConfig

    if (!layerKey) throw new Error('layers 参数未定义')
    this.#validateUniqueLayerKey(layerKey)

    const provider = this.#createImageryProvider(layerConfig)
    if (!provider) return null

    const layer = this.#viewer?.imageryLayers.addImageryProvider(provider)
    this.#storeLayer(layerKey, layer!, isDefault)
    return layer!
  }

  /**
   * 查询图层
   */
  getLayerByKey(key: string): ImageryLayer | undefined {
    return this.#defaultLayerMap.get(key) || this.#customLayerMap.get(key)
  }

  /**
   * 删除图层
   */
  removeLayerByKey(key: string): boolean {
    const { isDefault, layer } = this.#getLayerInfo(key)
    if (!layer) {
      console.warn(`图层 key ${key} 不存在`)
      return false
    }

    const removed = this.#viewer?.imageryLayers.remove(layer, true)
    if (removed) {
      this.#removeLayerKey(key, isDefault)
    }
    return removed!
  }

  /**
   * 批量删除图层
   */
  batchRemoveLayers(layerIds: string[]): void {
    layerIds.forEach((id) => this.removeLayerByKey(id))
  }

  // ===================== GeoJSON 图层管理 =====================

  /**
   * 添加 GeoJSON 图层
   */
  async addGeoJsonLayer(geoJson: GeoJsonType, isDefault: boolean = false): Promise<DataSource> {
    if (this.#geoJsonExists(geoJson.layerId)) {
      throw new Error(`GeoJSON图层ID ${geoJson.layerId} 已存在`)
    }

    const dataSource = await GeoJsonDataSource.load(geoJson.geojsonData, {
      markerColor: geoJson.style?.pointColor || Color.RED,
      stroke: geoJson.style?.lineColor || Color.BLUE,
      strokeWidth: geoJson.style?.lineWidth || 2,
      fill: geoJson.style?.polygonColor || Color.GREEN.withAlpha(0.3),
    })

    // 添加标签
    if (geoJson.labelEnabled) {
      this.addLabelsToDataSource(dataSource, geoJson.label!)
    }

    await this.#viewer?.dataSources.add(dataSource)
    this.#storeGeoJson(geoJson.layerId, dataSource, isDefault)
    return dataSource
  }

  /**
   * 查询 GeoJSON 数据源
   */
  getGeoJsonLayerById(layerId: string): DataSource | undefined {
    return this.#defaultGeoJsonMap.get(layerId) || this.#customGeoJsonMap.get(layerId)
  }

  /**
   * 删除 GeoJSON 图层
   */
  removeGeoJsonLayer(layerId: string): boolean {
    const { isDefault, dataSource } = this.#getGeoJsonInfo(layerId)
    if (!dataSource) {
      console.warn(`GeoJSON图层 ${layerId} 不存在`)
      return false
    }

    const removed = this.#viewer?.dataSources.remove(dataSource, true)
    if (removed) {
      this.#removeGeoJsonLayerId(layerId, isDefault)
    }
    return removed!
  }

  /**
   * 批量删除 GeoJSON 图层
   */
  batchRemoveGeoJsonLayers(layerIds: string[]): void {
    layerIds.forEach((id) => this.removeGeoJsonLayer(id))
  }

  /**
   * 清除 GeoJSON 图层
   */
  clearAllGeoJsonLayers(clearType: ClearType = 'custom'): void {
    const targetMap = this.#getTargetMapByType(
      clearType,
      this.#defaultGeoJsonMap,
      this.#customGeoJsonMap,
    )

    targetMap.forEach((dataSource) => {
      this.#viewer?.dataSources.remove(dataSource, true)
    })

    this.#clearMapsByType(clearType, this.#defaultGeoJsonMap, this.#customGeoJsonMap)
  }

  /**
   * 显示 GeoJSON 图层
   * @param layerId 图层ID
   * @returns boolean 是否成功显示
   */
  showGeoJsonLayer(layerId: string): boolean {
    const dataSource = this.getGeoJsonLayerById(layerId)

    if (!dataSource) {
      console.warn(`GeoJSON图层 ${layerId} 不存在，无法显示`)
      return false
    }

    // 显示数据源中的所有实体
    dataSource.show = true

    // 同时显示所有实体的标签
    dataSource.entities.values.forEach((entity) => {
      if (entity.label) {
        entity.label.show = new ConstantProperty(true)
      }
    })
    return true
  }

  /**
   * 隐藏 GeoJSON 图层
   * @param layerId 图层ID
   * @returns boolean 是否成功隐藏
   */
  hideGeoJsonLayer(layerId: string): boolean {
    const dataSource = this.getGeoJsonLayerById(layerId)

    if (!dataSource) {
      console.warn(`GeoJSON图层 ${layerId} 不存在，无法隐藏`)
      return false
    }

    // 隐藏数据源中的所有实体
    dataSource.show = false

    // 如果需要同时隐藏所有实体的标签
    dataSource.entities.values.forEach((entity) => {
      if (entity.label) {
        entity.label.show = new ConstantProperty(true)
      }
    })
    return true
  }

  /**
   * 切换 GeoJSON 图层的显示状态
   * @param layerId 图层ID
   * @returns boolean 切换后的显示状态（true=显示，false=隐藏），如果图层不存在则返回null
   */
  toggleGeoJsonLayer(layerId: string): boolean | null {
    const dataSource = this.getGeoJsonLayerById(layerId)

    if (!dataSource) {
      console.warn(`GeoJSON图层 ${layerId} 不存在，无法切换`)
      return null
    }

    const newState = !dataSource.show
    dataSource.show = newState

    // 同步更新所有实体的标签显示状态
    dataSource.entities.values.forEach((entity) => {
      if (entity.label) {
        entity.label.show = new ConstantProperty(newState)
      }
    })
    return newState
  }

  /**
   * 批量显示 GeoJSON 图层
   * @param layerIds 图层ID数组
   * @returns 成功显示的图层数量
   */
  batchShowGeoJsonLayers(layerIds: string[]): number {
    let successCount = 0

    layerIds.forEach((layerId) => {
      if (this.showGeoJsonLayer(layerId)) {
        successCount++
      }
    })
    return successCount
  }

  /**
   * 批量隐藏 GeoJSON 图层
   * @param layerIds 图层ID数组
   * @returns 成功隐藏的图层数量
   */
  batchHideGeoJsonLayers(layerIds: string[]): number {
    let successCount = 0

    layerIds.forEach((layerId) => {
      if (this.hideGeoJsonLayer(layerId)) {
        successCount++
      }
    })
    return successCount
  }

  /**
   * 获取 GeoJSON 图层的显示状态
   * @param layerId 图层ID
   * @returns boolean | null 显示状态，null表示图层不存在
   */
  getGeoJsonLayerVisibility(layerId: string): boolean | null {
    const dataSource = this.getGeoJsonLayerById(layerId)

    if (!dataSource) {
      console.warn(`GeoJSON图层 ${layerId} 不存在`)
      return null
    }

    return dataSource.show
  }

  // ===================== EWKB操作 =====================

  /**
   * 添加EWKB图层
   * @param viewer
   * @param ewkb
   * @param entityOptions
   */
  addEWkbLayer(ewkb: string, entityOptions: EntityOptions) {
    if (!Array.isArray(entityOptions.position)) {
      throw new Error('entityOptions.position必须是一个数组。')
    }
    // 将wkb转换为可识别数据
    const { longitude, latitude } = this.#parseEWKB(ewkb)

    // 设置entity
    entityOptions.position = [longitude, latitude, entityOptions.position[2]]

    return this.addCesiumEntity(entityOptions)
  }

  // ===================== 标签 =====================

  /**
   * 添加标签
   * @param dataSource
   * @param label
   */
  addLabelsToDataSource(dataSource: DataSource, label: labelConfig): void {
    const entities = dataSource.entities.values

    entities.forEach((entity) => {
      const labelText = label?.labelText || 'name'

      const center: Cartesian3 | [number, number, number] =
        label.center || this.#calculateTheCenterPositionOfTheSurface(entity)

      // 设置中心位置
      entity.position = new ConstantPositionProperty(this.convertPosition(center))

      if (labelText && entity.position) {
        // 确保位置存在
        entity.label = new LabelGraphics({
          text: labelText,
          font: label?.labelFont || `${label?.labelSize || 16}px "微软雅黑"`,
          fillColor: label?.labelColor || Color.WHITE,
          outlineColor: Color.BLACK, // 建议添加黑色描边，增强可读性
          outlineWidth: 1,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(label?.labelOffset?.x || 0, label?.labelOffset?.y || -20),
          verticalOrigin: label?.verticalOrigin || VerticalOrigin.CENTER,
          horizontalOrigin: label?.horizontalOrigin || HorizontalOrigin.CENTER,
          showBackground: true,
          backgroundColor: label?.backgroundColor || Color.TRANSPARENT,
          backgroundPadding: new Cartesian2(5, 3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        })
      }
    })
  }

  // ===================== 视角控制 =====================

  /**
   * 飞行到目标位置
   */
  flyToTarget(target: [number, number, number] | Cartesian3, duration = 2): void {
    const position = this.convertPosition(target)
    const cartographic = Cartographic.fromCartesian(position)
    this.#viewer!.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        CesiumMath.toDegrees(cartographic.longitude),
        CesiumMath.toDegrees(cartographic.latitude),
        cartographic.height,
      ),
      duration,
    })
  }

  /**
   * 调整视角到目标位置
   */
  viewToTarget(target: [number, number, number] | Cartesian3): void {
    const position = this.convertPosition(target)
    this.#viewer?.camera.setView({
      destination: position,
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-90),
        roll: 0.0,
      },
    })
  }

  // ===================== 清除与资源管理 =====================

  /**
   * 清除实体
   */
  clearAllEntities(clearType: ClearType = 'custom'): void {
    const targetIds = this.#getTargetIdsByType(
      clearType,
      this.#defaultEntityIds,
      this.#customEntityIds,
    )

    targetIds.forEach((id) => {
      const entity = this.#viewer?.entities.getById(id)
      if (entity) this.#viewer?.entities.remove(entity)
    })

    this.#clearCollectionsByType(clearType, this.#defaultEntityIds, this.#customEntityIds)
  }

  /**
   * 清除 Primitive
   */
  clearAllPrimitives(clearType: ClearType = 'custom'): void {
    const targetMap = this.#getTargetMapByType(
      clearType,
      this.#defaultPrimitiveMap,
      this.#customPrimitiveMap,
    )

    targetMap.forEach((primitive) => {
      this.#viewer?.scene.primitives.remove(primitive)
    })

    this.#clearMapsByType(clearType, this.#defaultPrimitiveMap, this.#customPrimitiveMap)
  }

  /**
   * 清除图层
   */
  clearAllLayers(clearType: ClearType = 'custom'): void {
    const targetMap = this.#getTargetMapByType(
      clearType,
      this.#defaultLayerMap,
      this.#customLayerMap,
    )

    targetMap.forEach((layer) => {
      this.#viewer?.imageryLayers.remove(layer, true)
    })

    this.#clearMapsByType(clearType, this.#defaultLayerMap, this.#customLayerMap)
  }

  /**
   * 清除所有资源
   */
  clearAllResources(clearType: ClearType = 'custom'): void {
    this.clearAllEntities(clearType)
    this.clearAllPrimitives(clearType)
    this.clearAllLayers(clearType)
    this.clearAllGeoJsonLayers(clearType)
  }

  // ===================== getter 和 setter函数 =====================
  getViewer(): Viewer | null {
    return this.#viewer
  }

  // ===================== 辅助函数 =====================

  convertPosition(pos: Cartesian3 | [number, number, number]): Cartesian3 {
    return Array.isArray(pos) ? Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0) : pos
  }

  convertPositionArray(positions: (Cartesian3 | [number, number, number])[]): Cartesian3[] {
    return positions.map((pos) => this.convertPosition(pos))
  }

  // ===================== 私有方法 =====================

  #configureEntityGraphics(entity: Entity, options: EntityOptions): void {
    switch (options.type) {
      case 'point': {
        const {
          color = Color.RED,
          pixelSize = 8,
          outlineColor = Color.WHITE,
          outlineWidth = 1,
        } = options.pointOptions || {}
        entity.point = new PointGraphics({ color, pixelSize, outlineColor, outlineWidth })
        break
      }
      case 'polyline': {
        const {
          positions,
          color = Color.BLUE,
          width = 3,
          clampToGround = false,
        } = options.polylineOptions || {}
        if (!positions) throw new Error('线实体必须传入 polylineOptions.positions')

        entity.polyline = new PolylineGraphics({
          positions: this.convertPositionArray(positions),
          material: new ColorMaterialProperty(color),
          width,
          clampToGround,
        })
        break
      }
      case 'billboard': {
        const {
          image,
          scale = 1,
          color = Color.WHITE,
          verticalOrigin = VerticalOrigin.CENTER,
          horizontalOrigin = HorizontalOrigin.CENTER,
        } = options.billboardOptions || {}
        if (!image) throw new Error('Billboard 实体必须传入 billboardOptions.image')

        entity.billboard = new BillboardGraphics({
          image,
          scale,
          color,
          verticalOrigin,
          horizontalOrigin,
        })
        break
      }
      case 'polygon': {
        const {
          hierarchy,
          color = Color.GREEN.withAlpha(0.7),
          outline = true,
          outlineColor = Color.BLACK,
          outlineWidth = 1,
          height = 0,
          extrudedHeight,
          perPositionHeight = true,
        } = options.polygonOptions || {}

        if (!hierarchy) throw new Error('多边形实体必须传入 polygonOptions.hierarchy')

        entity.polygon = new PolygonGraphics({
          hierarchy: this.#createConstantProperty(this.#processHierarchy(hierarchy)),
          material: new ColorMaterialProperty(color),
          outline: this.#createConstantProperty(outline),
          outlineColor: this.#createConstantProperty(outlineColor),
          outlineWidth: this.#createConstantProperty(outlineWidth),
          height: this.#createConstantProperty(height),
          extrudedHeight:
            extrudedHeight !== undefined ? this.#createConstantProperty(extrudedHeight) : undefined,
          perPositionHeight: this.#createConstantProperty(perPositionHeight),
        })
        break
      }
      default:
        throw new Error(`不支持的实体类型：${options.type}`)
    }
  }

  #processHierarchy(
    hier: PolygonHierarchy | Cartesian3[] | [number, number][] | [number, number, number][],
  ): PolygonHierarchy {
    if (hier instanceof PolygonHierarchy) return hier
    if (!Array.isArray(hier) || hier.length < 3) {
      throw new Error('多边形层级必须是非空数组且至少 3 个顶点')
    }

    const positions = hier.map((pos) => {
      if (pos instanceof Cartesian3) return pos
      if (Array.isArray(pos) && pos.length >= 2) {
        return Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0)
      }
      throw new Error(
        `无效坐标格式：${JSON.stringify(pos)}，应为 [经, 纬] 或 [经, 纬, 高] 或 Cartesian3`,
      )
    })

    return new PolygonHierarchy(positions)
  }

  #createConstantProperty(value: unknown): ConstantProperty {
    return new ConstantProperty(value)
  }

  #validateUniqueId(id: string): void {
    if (this.#defaultEntityIds.has(id) || this.#customEntityIds.has(id)) {
      throw new Error(`实体 ID ${id} 已存在`)
    }
  }

  #entityExists(id: string): boolean {
    return this.#defaultEntityIds.has(id) || this.#customEntityIds.has(id)
  }

  #storeEntityId(id: string, isDefault: boolean): void {
    if (isDefault) {
      this.#defaultEntityIds.add(id)
    } else {
      this.#customEntityIds.add(id)
    }
  }

  #removeEntityId(id: string): void {
    this.#defaultEntityIds.delete(id)
    this.#customEntityIds.delete(id)
  }

  #groupPrimitivesByType(primitives: PrimitiveOptions[]) {
    // 替换原第640行附近的代码段落为以下内容：
    const grouped: {
      points: PrimitiveOptions[]
      polylines: PrimitiveOptions[]
      polygons: PrimitiveOptions[]
      billboards: PrimitiveOptions[]
    } = {
      points: [],
      polylines: [],
      polygons: [],
      billboards: [],
    }

    primitives.forEach((option) => {
      const { id } = option
      // 验证图层是否已经存在
      this.#validatePrimitiveUniqueId(id)

      switch (option.type) {
        case 'point':
          grouped.points.push(option)
          break
        case 'polyline':
          grouped.polylines.push(option)
          break
        case 'polygon':
          grouped.polygons.push(option)
          break
        case 'billboard':
          grouped.billboards.push(option)
          break
      }
    })

    return grouped
  }

  #validatePrimitiveUniqueId(id: string): void {
    if (this.#defaultPrimitiveMap.has(id) || this.#customPrimitiveMap.has(id)) {
      throw new Error(`Primitive ID ${id} 已存在`)
    }
  }

  #getPrimitiveInfo(id: string) {
    const isDefault = this.#defaultPrimitiveMap.has(id)
    const primitive = isDefault
      ? this.#defaultPrimitiveMap.get(id)
      : this.#customPrimitiveMap.get(id)
    return { isDefault, primitive }
  }

  #removePrimitiveId(id: string, isDefault: boolean): void {
    if (isDefault) {
      this.#defaultPrimitiveMap.delete(id)
    } else {
      this.#customPrimitiveMap.delete(id)
    }
  }

  #addPointPrimitives(options: PrimitiveOptions[]): void {
    const instances = options.map((option) => {
      const position = this.convertPosition(option.positions[0]!)
      return new GeometryInstance({
        id: option.id,
        geometry: new CircleGeometry({
          center: position,
          radius: option.pixelSize || 8,
          vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(option.color || Color.RED),
        },
      })
    })

    const primitive = new Primitive({
      geometryInstances: instances,
      appearance: new PerInstanceColorAppearance({ translucent: false, closed: true }),
      asynchronous: false,
    })

    this.#viewer?.scene.primitives.add(primitive)
    this.#storePrimitives(options, primitive)
  }

  #addPolylinePrimitives(options: PrimitiveOptions[]): void {
    const instances = options.map((option) => {
      const positions = this.convertPositionArray(option.positions)
      return new GeometryInstance({
        id: option.id,
        geometry: new PolylineGeometry({
          positions,
          width: option.width || 3,
          vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(option.color || Color.BLUE),
        },
      })
    })

    const primitive = new Primitive({
      geometryInstances: instances,
      appearance: new PolylineColorAppearance({ translucent: true }),
      asynchronous: false,
    })

    this.#viewer?.scene.primitives.add(primitive)
    this.#storePrimitives(options, primitive)
  }

  #addPolygonPrimitives(options: PrimitiveOptions[]): void {
    const instances = options.map((option) => {
      const positions = this.convertPositionArray(option.positions)
      return new GeometryInstance({
        id: option.id,
        geometry: new PolygonGeometry({
          polygonHierarchy: new PolygonHierarchy(positions),
          vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(
            option.color || Color.GREEN.withAlpha(0.5),
          ),
        },
      })
    })

    const primitive = new Primitive({
      geometryInstances: instances,
      appearance: new PerInstanceColorAppearance({ translucent: true, closed: true }),
      asynchronous: false,
    })

    this.#viewer?.scene.primitives.add(primitive)
    this.#storePrimitives(options, primitive)
  }

  #addBillboardPrimitives(options: PrimitiveOptions[]): void {
    const collection = new BillboardCollection()

    options.forEach((option) => {
      const position = this.convertPosition(option.positions[0]!)
      collection.add({
        id: option.id,
        position,
        image: option.image,
        scale: option.scale || 1,
        color: option.color || Color.WHITE,
      })
    })

    this.#viewer?.scene.primitives.add(collection)
    this.#storePrimitives(options, collection)
  }

  #storePrimitives(options: PrimitiveOptions[], primitive: Primitive | BillboardCollection): void {
    options.forEach((option) => {
      if (option.default) {
        this.#defaultPrimitiveMap.set(option.id, primitive)
      } else {
        this.#customPrimitiveMap.set(option.id, primitive)
      }
    })
  }

  #validateUniqueLayerKey(key: string): void {
    if (this.#defaultLayerMap.has(key) || this.#customLayerMap.has(key)) {
      console.warn(`图层 ${key} 已存在，将覆盖原有图层`)
      this.removeLayerByKey(key)
    }
  }

  #createImageryProvider(layerConfig: LayerConfig): ImageryProvider | null {
    switch (layerConfig.type) {
      case 'imagery':
        return new ArcGisMapServerImageryProvider({ url: layerConfig.url })
      case 'wms':
        return new WebMapServiceImageryProvider({
          url: layerConfig.url,
          layers: layerConfig.layers,
          parameters: layerConfig.parameters || { format: 'image/png' },
        })
      case 'wmts':
        return new WebMapTileServiceImageryProvider({
          url: layerConfig.url,
          layer: layerConfig.layers,
          style: layerConfig.style || 'default',
          format: layerConfig.format || 'image/png',
          tileMatrixSetID: layerConfig.tileMatrixSetID || 'EPSG:4326',
          credit: '',
        })
      default:
        console.error(`不支持的图层类型：${layerConfig.type}`)
        return null
    }
  }

  #storeLayer(key: string, layer: ImageryLayer, isDefault: boolean): void {
    if (isDefault) {
      this.#defaultLayerMap.set(key, layer)
    } else {
      this.#customLayerMap.set(key, layer)
    }
  }

  #getLayerInfo(key: string) {
    const isDefault = this.#defaultLayerMap.has(key)
    const layer = isDefault ? this.#defaultLayerMap.get(key) : this.#customLayerMap.get(key)
    return { isDefault, layer }
  }

  #removeLayerKey(key: string, isDefault: boolean): void {
    if (isDefault) this.#defaultLayerMap.delete(key)
    else this.#customLayerMap.delete(key)
  }

  #geoJsonExists(layerId: string): boolean {
    return this.#defaultGeoJsonMap.has(layerId) || this.#customGeoJsonMap.has(layerId)
  }

  #storeGeoJson(layerId: string, dataSource: DataSource, isDefault: boolean): void {
    if (isDefault) this.#defaultGeoJsonMap.set(layerId, dataSource)
    else this.#customGeoJsonMap.set(layerId, dataSource)
  }

  #getGeoJsonInfo(layerId: string) {
    const isDefault = this.#defaultGeoJsonMap.has(layerId)
    const dataSource = isDefault
      ? this.#defaultGeoJsonMap.get(layerId)
      : this.#customGeoJsonMap.get(layerId)
    return { isDefault, dataSource }
  }

  #removeGeoJsonLayerId(layerId: string, isDefault: boolean): void {
    if (isDefault) this.#defaultGeoJsonMap.delete(layerId)
    else this.#customGeoJsonMap.delete(layerId)
  }

  #getTargetIdsByType(
    clearType: ClearType,
    defaultSet: Set<string>,
    customSet: Set<string>,
  ): Set<string> {
    const targetIds = new Set<string>()
    if (clearType === 'default' || clearType === 'all')
      defaultSet.forEach((id) => targetIds.add(id))
    if (clearType === 'custom' || clearType === 'all') customSet.forEach((id) => targetIds.add(id))
    return targetIds
  }

  #getTargetMapByType<T>(
    clearType: ClearType,
    defaultMap: Map<string, T>,
    customMap: Map<string, T>,
  ): Map<string, T> {
    const targetMap = new Map<string, T>()
    if (clearType === 'default' || clearType === 'all')
      defaultMap.forEach((value, key) => targetMap.set(key, value))
    if (clearType === 'custom' || clearType === 'all')
      customMap.forEach((value, key) => targetMap.set(key, value))
    return targetMap
  }

  #clearCollectionsByType(
    clearType: ClearType,
    defaultSet: Set<string>,
    customSet: Set<string>,
  ): void {
    if (clearType === 'default' || clearType === 'all') defaultSet.clear()
    if (clearType === 'custom' || clearType === 'all') customSet.clear()
  }

  #clearMapsByType<T>(
    clearType: ClearType,
    defaultMap: Map<string, T>,
    customMap: Map<string, T>,
  ): void {
    if (clearType === 'default' || clearType === 'all') defaultMap.clear()
    if (clearType === 'custom' || clearType === 'all') customMap.clear()
  }

  /**
   * 计算面要素的中心点作为标签位置
   * @param entity
   * @returns
   */
  #calculateTheCenterPositionOfTheSurface(entity: Entity): Cartesian3 {
    // 计算面要素的中心点作为标签位置
    if (entity.polygon) {
      // 获取面的层级坐标
      const hierarchy = entity.polygon.hierarchy?.getValue(JulianDate.now())
      if (hierarchy) {
        // 提取所有顶点坐标
        const positions = hierarchy.positions
        if (positions && positions.length > 0) {
          // 计算中心点（简单平均法，适用于大多数面要素）
          let lonSum = 0,
            latSum = 0,
            heightSum = 0
          positions.forEach((pos: Cartesian3) => {
            const cartographic = Cartographic.fromCartesian(pos)
            lonSum += cartographic.longitude
            latSum += cartographic.latitude
            heightSum += cartographic.height || 0
          })
          const centerLon = lonSum / positions.length
          const centerLat = latSum / positions.length
          const centerHeight = heightSum / positions.length + 100 // 轻微抬高避免被面遮挡
          // 返回中心点
          return Cartesian3.fromRadians(centerLon, centerLat, centerHeight)
        }
      }
    }
    return Cartesian3.ZERO
  }

  /**
   * 解析EWKB
   * @param ewkbHex
   * @returns
   */
  #parseEWKB(ewkbHex: string): { longitude: number; latitude: number; srid: number } {
    // 去掉可能的空格
    const hexString = ewkbHex.trim()

    // 将十六进制字符串转换为字节数组
    const bytes = []
    for (let i = 0; i < hexString.length; i += 2) {
      bytes.push(parseInt(hexString.substr(i, 2), 16))
    }

    const dataView = new DataView(new Uint8Array(bytes).buffer)

    // 第一个字节：字节顺序 (0 = big-endian, 1 = little-endian)
    const byteOrder = dataView.getUint8(0)
    const isLittleEndian = byteOrder === 1

    // 读取类型码（4字节）
    let type = dataView.getUint32(1, isLittleEndian)

    let offset = 5 // 1字节顺序 + 4字节类型

    // 检查是否有SRID（如果类型码的第30位为1）
    let srid = 4326 // 默认WGS84
    const hasSRID = (type & 0x20000000) !== 0

    if (hasSRID) {
      // 清除SRID标志位
      type = type & ~0x20000000
      // 读取SRID（4字节）
      srid = dataView.getUint32(offset, isLittleEndian)
      offset += 4
    }

    // 读取经度（8字节，双精度浮点数）
    const longitude = dataView.getFloat64(offset, isLittleEndian)
    offset += 8

    // 读取纬度（8字节，双精度浮点数）
    const latitude = dataView.getFloat64(offset, isLittleEndian)

    return { longitude, latitude, srid }
  }
}
