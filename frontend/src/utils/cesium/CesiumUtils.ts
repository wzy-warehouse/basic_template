import type { CesiumInitOptions } from '@/types/cesium/CesiumInitOptions'
import type { EntityOptions } from '@/types/cesium/EntityOptions'
import type { PrimitiveOptions } from '@/types/cesium/PrimitiveOptions'
import type { LayerConfig } from '@/types/cesium/LayerConfig'
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
} from 'cesium'
import config from '@/config/config.json'

// 定义清除类型枚举（增强类型安全）
export type ClearType = 'default' | 'custom' | 'all'

/**
 * Cesium 工具类
 * 封装 Cesium 核心操作，区分默认/自定义资源管理，支持精准增删改查
 */
export class CesiumUtils {
  // ===================== 实体管理（区分默认/自定义） =====================
  // 私有属性：默认实体ID集合（不希望被轻易清空的）
  #defaultEntityIds: Set<string> = new Set<string>()
  // 私有属性：自定义实体ID集合（业务添加的，可自由清空）
  #customEntityIds: Set<string> = new Set<string>()

  // ===================== Primitive管理（区分默认/自定义） =====================
  // 私有属性：默认Primitive映射（key: ID，value: 实例）
  #defaultPrimitiveMap: Map<string, Primitive | BillboardCollection> = new Map<
    string,
    Primitive | BillboardCollection
  >()
  // 私有属性：自定义Primitive映射
  #customPrimitiveMap: Map<string, Primitive | BillboardCollection> = new Map<
    string,
    Primitive | BillboardCollection
  >()

  // ===================== 图层管理（区分默认/自定义） =====================
  // 私有属性：默认图层映射（key: layerConfig.layers，value: 实例）
  #defaultLayerMap: Map<string, ImageryLayer> = new Map<string, ImageryLayer>()
  // 私有属性：自定义图层映射
  #customLayerMap: Map<string, ImageryLayer> = new Map<string, ImageryLayer>()

  constructor() {
    // 初始化Cesium Ion Token
    Ion.defaultAccessToken = config.cesiumIonDefaultAccessToken
  }

  /**
   * 初始化 Cesium Viewer 实例
   * @description 封装默认配置，支持自定义扩展，返回 Viewer 实例供全局使用
   * @param options - 初始化配置项
   * @param tdMapToken - 天地图服务 token 数组
   * @param type - 底图类型：0 - 天地图「影像底图 + 影像注记」其他 - 天地图「纯矢量底图」（无注记）
   * @returns Viewer 实例
   */
  initCesiumViewer(options: CesiumInitOptions, tdMapToken?: string[], type: number = 0): Viewer {
    // 默认天地图token
    tdMapToken = tdMapToken || config.tdMapToken

    // 默认配置（优先级：用户传入 > 默认）
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

    // 初始化 Viewer
    const viewer = new Viewer(container, {
      ...finalOptions,
      terrainProvider: finalOptions.terrain
        ? new CesiumTerrainProvider({ url: finalOptions.terrain })
        : new EllipsoidTerrainProvider(),

      //截图和渲染相关的一些配置
      contextOptions: {
        webgl: {
          alpha: true,
          depth: false,
          stencil: true,
          antialias: true,
          premultipliedAlpha: true,
          //cesium状态下允许canvas转图片convertToImage
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: true,
        },
        allowTextureFilterAnisotropic: true,
      },
    })

    // 优化性能：关闭不必要的渲染
    viewer.scene.globe.depthTestAgainstTerrain = false
    viewer.scene.fog.enabled = false
    viewer.scene.globe.enableLighting = false //全局光照
    viewer.shadows = false
    const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement
    creditContainer.style.display = 'none'

    // 添加底图
    this.imageryProvider(type, tdMapToken).forEach((imageryProvider) => {
      viewer.imageryLayers.addImageryProvider(imageryProvider)
    })

    return viewer
  }

  /**
   * 添加底图
   * @param type - 底图类型：0 - 天地图影像；1 - 内网自定义瓦片底图；其他 - 天地图「纯矢量底图」（无注记）
   * @param tdMapToken - 天地图token数组
   * @returns ImageryProvider 实例数组
   */
  imageryProvider(type: number, tdMapToken: string[]): ImageryProvider[] {
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
      // 随机选择token避免单token超限
      const currentTokenIndex = Math.floor(Math.random() * tdMapToken.length)

      const imageryProvider = new WebMapTileServiceImageryProvider({
        url: `https://{s}.tianditu.gov.cn/img_w/wmts?tk=${tdMapToken[currentTokenIndex]}`,
        layer: 'img',
        ...option,
      })

      const annotationProvider = new WebMapTileServiceImageryProvider({
        url: `https://{s}.tianditu.gov.cn/cia_w/wmts?tk=${tdMapToken[currentTokenIndex]}`,
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

  /**
   * 添加实体到场景
   * @description 统一处理点、线、Billboard 实体的创建，支持区分默认/自定义实体
   * @param viewer - Cesium Viewer 实例
   * @param entityOptions - 实体配置项（必传 id、position、type，default标识是否为默认实体）
   * @returns 创建的 Entity 实例
   */
  addCesiumEntity(viewer: Viewer, entityOptions: EntityOptions): Entity {
    const { id, position, type, attributes = {}, default: isDefault = false } = entityOptions

    if (!id) throw new Error('实体 id 为必填项')
    if (!position) throw new Error('实体 position 为必填项')

    // 校验ID唯一性（跨默认/自定义集合）
    if (this.#defaultEntityIds.has(id) || this.#customEntityIds.has(id)) {
      throw new Error(`实体 ID ${id} 已存在，请勿重复添加`)
    }

    // 实体基础配置
    const entity = new Entity({
      id,
      position: this.convertPosition(position),
      ...attributes, // 挂载自定义属性
    })

    // 根据类型配置实体图形
    switch (type) {
      case 'point': {
        const {
          color = Color.RED,
          pixelSize = 8,
          outlineColor = Color.WHITE,
          outlineWidth = 1,
        } = entityOptions.pointOptions || {}
        entity.point = new PointGraphics({
          color,
          pixelSize,
          outlineColor,
          outlineWidth,
        })
        break
      }
      case 'polyline': {
        const {
          positions,
          color = Color.BLUE,
          width = 3,
          clampToGround = false,
        } = entityOptions.polylineOptions || {}
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
        } = entityOptions.billboardOptions || {}
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
        } = entityOptions.polygonOptions || {}

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
        throw new Error(`不支持的实体类型：${type}`)
    }

    // 添加到场景并根据default标识存入对应集合
    viewer.entities.add(entity)
    if (isDefault) {
      this.#defaultEntityIds.add(id)
    } else {
      this.#customEntityIds.add(id)
    }

    return entity
  }

  /**
   * 根据 ID 删除实体
   * @description 安全删除实体，自动识别默认/自定义并清理对应存储
   * @param viewer - Cesium Viewer 实例
   * @param entityId - 实体 ID
   * @returns 是否删除成功
   */
  removeCesiumEntity(viewer: Viewer, entityId: string): boolean {
    // 先判断实体类型（默认/自定义）
    const isDefault = this.#defaultEntityIds.has(entityId)
    const isCustom = this.#customEntityIds.has(entityId)

    if (!isDefault && !isCustom) {
      console.warn(`实体 ID ${entityId} 不存在`)
      return false
    }

    const entity = viewer.entities.getById(entityId)
    if (entity) {
      viewer.entities.remove(entity)
      // 清理对应集合
      if (isDefault) {
        this.#defaultEntityIds.delete(entityId)
      } else {
        this.#customEntityIds.delete(entityId)
      }
      return true
    }
    return false
  }

  /**
   * 批量删除实体
   * @param viewer - Cesium Viewer 实例
   * @param entityIds - 要删除的实体ID数组
   */
  batchRemoveCesiumEntities(viewer: Viewer, entityIds: string[]): void {
    entityIds.forEach((id) => this.removeCesiumEntity(viewer, id))
  }

  /**
   * 清除实体（支持按类型筛选）
   * @description 精准清除默认/自定义/全部实体
   * @param viewer - Cesium Viewer 实例
   * @param clearType - 清除类型：default（默认）/custom（自定义）/all（全部）
   */
  clearAllEntities(viewer: Viewer, clearType: ClearType = 'custom'): void {
    const targetIds = new Set<string>()

    // 确定要清除的实体ID集合
    if (clearType === 'default') {
      targetIds.forEach((id) => this.#defaultEntityIds.add(id))
    } else if (clearType === 'custom') {
      this.#customEntityIds.forEach((id) => targetIds.add(id))
    } else {
      this.#defaultEntityIds.forEach((id) => targetIds.add(id))
      this.#customEntityIds.forEach((id) => targetIds.add(id))
    }

    // 执行删除并清理对应集合
    targetIds.forEach((id) => {
      const entity = viewer.entities.getById(id)
      if (entity) viewer.entities.remove(entity)
    })

    if (clearType === 'default') {
      this.#defaultEntityIds.clear()
    } else if (clearType === 'custom') {
      this.#customEntityIds.clear()
    } else {
      this.#defaultEntityIds.clear()
      this.#customEntityIds.clear()
    }
  }

  /**
   * 根据 ID 查询实体
   * @description 安全查询实体，自动识别默认/自定义
   * @param viewer - Cesium Viewer 实例
   * @param entityId - 实体 ID
   * @returns Entity 实例或 null
   */
  getCesiumEntityById(viewer: Viewer, entityId: string): Entity | null {
    // 先校验是否在管理集合中
    if (!this.#defaultEntityIds.has(entityId) && !this.#customEntityIds.has(entityId)) {
      return null
    }
    return viewer.entities.getById(entityId) || null
  }

  /**
   * 定位视角到目标位置
   * @description 支持经纬度数组或 Cartesian3，可配置飞行时间
   * @param viewer - Cesium Viewer 实例
   * @param target - 目标位置（经纬度高程数组 或 Cartesian3）
   * @param duration - 飞行时间（秒，默认：2）
   */
  flyToTarget(viewer: Viewer, target: [number, number, number] | Cartesian3, duration = 2): void {
    const position = this.convertPosition(target)
    const cartographic = Cartographic.fromCartesian(position)
    viewer.camera.flyTo({
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
   * @param viewer - Cesium Viewer 实例
   * @param target - 目标位置（经纬度高程数组 或 Cartesian3）
   */
  viewToTarget(viewer: Viewer, target: [number, number, number] | Cartesian3): void {
    const position = this.convertPosition(target)
    viewer.camera.setView({
      destination: position,
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-90),
        roll: 0.0,
      },
    })
  }

  /**
   * 批量添加Primitive类型的点线面和广告牌
   * @description 区分默认/自定义Primitive，精准管理
   * @param viewer - Cesium Viewer实例
   * @param primitives - 要添加的primitive数组（含default标识）
   */
  addPrimitivesBatch(viewer: Viewer, primitives: PrimitiveOptions[]): void {
    // 按类型分组处理，提高渲染性能
    const pointOptions: PrimitiveOptions[] = []
    const polylineOptions: PrimitiveOptions[] = []
    const polygonOptions: PrimitiveOptions[] = []
    const billboardOptions: PrimitiveOptions[] = []

    // 分组并校验ID唯一性（跨默认/自定义）
    primitives.forEach((option) => {
      const { id } = option
      if (this.#defaultPrimitiveMap.has(id) || this.#customPrimitiveMap.has(id)) {
        throw new Error(`Primitive ID ${id} 已存在，请勿重复添加`)
      }

      switch (option.type) {
        case 'point':
          pointOptions.push(option)
          break
        case 'polyline':
          polylineOptions.push(option)
          break
        case 'polygon':
          polygonOptions.push(option)
          break
        case 'billboard':
          billboardOptions.push(option)
          break
      }
    })

    // 处理点
    if (pointOptions.length > 0) {
      const appearance = new PerInstanceColorAppearance({
        translucent: false,
        closed: true,
      })

      const instances = pointOptions.map((option) => {
        const firstPosition = option.positions?.[0]
        if (!firstPosition) {
          throw new Error('positions 数组为空或首项缺失')
        }
        const position = this.convertPosition(firstPosition)
        return new GeometryInstance({
          id: option.id,
          geometry: new CircleGeometry({
            center: position,
            radius: option.pixelSize || 8,
            vertexFormat: appearance.vertexFormat,
          }),
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(option.color || Color.RED),
          },
        })
      })

      const pointPrimitive = new Primitive({
        geometryInstances: instances,
        appearance: appearance,
        asynchronous: false,
      })

      viewer.scene.primitives.add(pointPrimitive)

      // 按default标识存入对应映射
      pointOptions.forEach((option) => {
        const { id, default: isDefault = false } = option
        if (isDefault) {
          this.#defaultPrimitiveMap.set(id, pointPrimitive)
        } else {
          this.#customPrimitiveMap.set(id, pointPrimitive)
        }
      })
    }

    // 处理线
    if (polylineOptions.length > 0) {
      const appearance = new PolylineColorAppearance({
        translucent: true,
      })

      const instances = polylineOptions.map((option) => {
        const positions = this.convertPositionArray(option.positions)
        return new GeometryInstance({
          id: option.id,
          geometry: new PolylineGeometry({
            positions,
            width: option.width || 3,
            vertexFormat: appearance.vertexFormat,
          }),
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(option.color || Color.BLUE),
          },
        })
      })

      const polylinePrimitive = new Primitive({
        geometryInstances: instances,
        appearance: new PolylineColorAppearance({
          translucent: true,
        }),
        asynchronous: false,
      })

      viewer.scene.primitives.add(polylinePrimitive)

      // 按default标识存入对应映射
      polylineOptions.forEach((option) => {
        const { id, default: isDefault = false } = option
        if (isDefault) {
          this.#defaultPrimitiveMap.set(id, polylinePrimitive)
        } else {
          this.#customPrimitiveMap.set(id, polylinePrimitive)
        }
      })
    }

    // 处理面
    if (polygonOptions.length > 0) {
      const appearance = new PerInstanceColorAppearance({
        translucent: true,
        closed: true,
      })

      const instances = polygonOptions.map((option) => {
        const positions = this.convertPositionArray(option.positions)
        return new GeometryInstance({
          id: option.id,
          geometry: new PolygonGeometry({
            polygonHierarchy: new PolygonHierarchy(positions),
            vertexFormat: appearance.vertexFormat,
          }),
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(
              option.color || Color.GREEN.withAlpha(0.5),
            ),
          },
        })
      })

      const polygonPrimitive = new Primitive({
        geometryInstances: instances,
        appearance: new PerInstanceColorAppearance({
          translucent: true,
          closed: true,
        }),
        asynchronous: false,
      })

      viewer.scene.primitives.add(polygonPrimitive)

      // 按default标识存入对应映射
      polygonOptions.forEach((option) => {
        const { id, default: isDefault = false } = option
        if (isDefault) {
          this.#defaultPrimitiveMap.set(id, polygonPrimitive)
        } else {
          this.#customPrimitiveMap.set(id, polygonPrimitive)
        }
      })
    }

    // 处理广告牌
    if (billboardOptions.length > 0) {
      const billboardCollection = new BillboardCollection()

      billboardOptions.forEach((option) => {
        const firstPosition = option.positions?.[0]
        if (!firstPosition) {
          throw new Error('positions 数组为空或第一个元素未定义')
        }
        const position = this.convertPosition(firstPosition)
        billboardCollection.add({
          id: option.id,
          position,
          image: option.image,
          scale: option.scale || 1,
          color: option.color || Color.WHITE,
        })
      })

      viewer.scene.primitives.add(billboardCollection)

      // 按default标识存入对应映射
      billboardOptions.forEach((option) => {
        const { id, default: isDefault = false } = option
        if (isDefault) {
          this.#defaultPrimitiveMap.set(id, billboardCollection)
        } else {
          this.#customPrimitiveMap.set(id, billboardCollection)
        }
      })
    }
  }

  /**
   * 根据ID获取Primitive实例
   * @description 自动识别默认/自定义Primitive
   * @param id - Primitive的ID
   * @returns 对应的Primitive或BillboardCollection实例（不存在返回undefined）
   */
  getPrimitiveById(id: string): Primitive | BillboardCollection | undefined {
    return this.#defaultPrimitiveMap.get(id) || this.#customPrimitiveMap.get(id)
  }

  /**
   * 根据ID删除Primitive
   * @description 自动识别默认/自定义并清理对应存储
   * @param viewer - Cesium Viewer实例
   * @param id - Primitive的ID
   * @returns 是否删除成功
   */
  removePrimitiveById(viewer: Viewer, id: string): boolean {
    // 先判断Primitive类型
    const isDefault = this.#defaultPrimitiveMap.has(id)
    const isCustom = this.#customPrimitiveMap.has(id)

    if (!isDefault && !isCustom) {
      console.warn(`Primitive ID ${id} 不存在`)
      return false
    }

    const primitive = isDefault ? this.#defaultPrimitiveMap.get(id) : this.#customPrimitiveMap.get(id)
    if (primitive) {
      // 从场景中移除
      viewer.scene.primitives.remove(primitive)
      // 清理对应映射
      if (isDefault) {
        this.#defaultPrimitiveMap.delete(id)
      } else {
        this.#customPrimitiveMap.delete(id)
      }
      return true
    }
    return false
  }

  /**
   * 清除Primitive（支持按类型筛选）
   * @description 精准清除默认/自定义/全部Primitive
   * @param viewer - Cesium Viewer实例
   * @param clearType - 清除类型：default（默认）/custom（自定义）/all（全部）
   */
  clearAllPrimitives(viewer: Viewer, clearType: ClearType = 'custom'): void {
    const targetMap = new Map<string, Primitive | BillboardCollection>()

    // 确定要清除的Primitive映射
    if (clearType === 'default') {
      this.#defaultPrimitiveMap.forEach((value, key) => targetMap.set(key, value))
    } else if (clearType === 'custom') {
      this.#customPrimitiveMap.forEach((value, key) => targetMap.set(key, value))
    } else {
      this.#defaultPrimitiveMap.forEach((value, key) => targetMap.set(key, value))
      this.#customPrimitiveMap.forEach((value, key) => targetMap.set(key, value))
    }

    // 执行删除
    targetMap.forEach((primitive) => {
      viewer.scene.primitives.remove(primitive)
    })

    // 清理对应映射
    if (clearType === 'default') {
      this.#defaultPrimitiveMap.clear()
    } else if (clearType === 'custom') {
      this.#customPrimitiveMap.clear()
    } else {
      this.#defaultPrimitiveMap.clear()
      this.#customPrimitiveMap.clear()
    }
  }

  /**
   * 创建通用图层（支持imagery/wms/wmts）
   * @description 区分默认/自定义图层，精准管理
   * @param viewer - Cesium Viewer实例
   * @param layerConfig - 图层配置（含default标识）
   * @returns 创建的ImageryLayer实例（失败返回null）
   */
  createLayer(viewer: Viewer, layerConfig: LayerConfig): ImageryLayer | null {
    if (!layerConfig.layers) {
      throw new Error('layers 参数未定义')
    }

    const { layers: layerKey, default: isDefault = false } = layerConfig

    // 校验图层唯一性（跨默认/自定义）
    if (this.#defaultLayerMap.has(layerKey) || this.#customLayerMap.has(layerKey)) {
      console.warn(`图层 ${layerKey} 已存在，将覆盖原有图层`)
      this.removeLayerByKey(layerKey, viewer)
    }

    let provider: ImageryProvider | null = null
    switch (layerConfig.type) {
      case 'imagery':
        provider = new ArcGisMapServerImageryProvider({ url: layerConfig.url })
        break
      case 'wms': // Geoserver WMS
        provider = new WebMapServiceImageryProvider({
          url: layerConfig.url,
          layers: layerConfig.layers,
          parameters: layerConfig.parameters || { format: 'image/png' },
        })
        break
      case 'wmts': // Geoserver WMTS
        provider = new WebMapTileServiceImageryProvider({
          url: layerConfig.url,
          layer: layerConfig.layers,
          style: layerConfig.style || 'default',
          format: layerConfig.format || 'image/png',
          tileMatrixSetID: layerConfig.tileMatrixSetID || 'EPSG:4326',
          credit: '',
        })
        break
      default:
        console.error(`不支持的图层类型：${layerConfig.type}`)
        return null
    }

    if (provider) {
      const layer = viewer.imageryLayers.addImageryProvider(provider)
      // 按default标识存入对应映射
      if (isDefault) {
        this.#defaultLayerMap.set(layerKey, layer)
      } else {
        this.#customLayerMap.set(layerKey, layer)
      }
      return layer
    }
    return null
  }

  /**
   * 根据图层key（layerConfig.layers）获取图层实例
   * @description 自动识别默认/自定义图层
   * @param key - 图层key（layerConfig.layers）
   * @returns ImageryLayer实例（不存在返回undefined）
   */
  getLayerByKey(key: string): ImageryLayer | undefined {
    return this.#defaultLayerMap.get(key) || this.#customLayerMap.get(key)
  }

  /**
   * 根据图层key删除图层
   * @description 自动识别默认/自定义并清理对应存储
   * @param key - 图层key（layerConfig.layers）
   * @param viewer - Cesium Viewer实例
   * @returns 是否删除成功
   */
  removeLayerByKey(key: string, viewer: Viewer): boolean {
    // 先判断图层类型
    const isDefault = this.#defaultLayerMap.has(key)
    const isCustom = this.#customLayerMap.has(key)

    if (!isDefault && !isCustom) {
      console.warn(`图层 key ${key} 不存在`)
      return false
    }

    const layer = isDefault ? this.#defaultLayerMap.get(key) : this.#customLayerMap.get(key)
    if (layer) {
      // 从场景中移除图层
      viewer.imageryLayers.remove(layer)
      // 清理对应映射
      if (isDefault) {
        this.#defaultLayerMap.delete(key)
      } else {
        this.#customLayerMap.delete(key)
      }
      return true
    }
    return false
  }

  /**
   * 清除图层（支持按类型筛选）
   * @description 精准清除默认/自定义/全部自定义图层
   * @param viewer - Cesium Viewer实例
   * @param clearType - 清除类型：default（默认）/custom（自定义）/all（全部）
   */
  clearAllCustomLayers(viewer: Viewer, clearType: ClearType = 'custom'): void {
    const targetMap = new Map<string, ImageryLayer>()

    // 确定要清除的图层映射
    if (clearType === 'default') {
      this.#defaultLayerMap.forEach((value, key) => targetMap.set(key, value))
    } else if (clearType === 'custom') {
      this.#customLayerMap.forEach((value, key) => targetMap.set(key, value))
    } else {
      this.#defaultLayerMap.forEach((value, key) => targetMap.set(key, value))
      this.#customLayerMap.forEach((value, key) => targetMap.set(key, value))
    }

    // 执行删除
    targetMap.forEach((layer) => {
      viewer.imageryLayers.remove(layer)
    })

    // 清理对应映射
    if (clearType === 'default') {
      this.#defaultLayerMap.clear()
    } else if (clearType === 'custom') {
      this.#customLayerMap.clear()
    } else {
      this.#defaultLayerMap.clear()
      this.#customLayerMap.clear()
    }
  }

  /**
   * 批量清除所有私有资源（实体/Primitive/图层）
   * @description 支持按类型筛选，精准控制清除范围
   * @param viewer - Cesium Viewer实例
   * @param clearType - 清除类型：default（默认）/custom（自定义）/all（全部）
   */
  clearAllPrivateObject(viewer: Viewer, clearType: ClearType = 'custom'): void {
    this.clearAllEntities(viewer, clearType)
    this.clearAllPrimitives(viewer, clearType)
    this.clearAllCustomLayers(viewer, clearType)
  }

  /**
   * 销毁 Cesium 实例
   * @description 释放所有内存，避免泄漏（页面卸载时调用）
   * @param viewer - Cesium Viewer 实例
   */
  destroyCesiumViewer(viewer: Viewer): void {
    if (viewer) {
      // 清除所有资源（默认+自定义）
      this.clearAllPrivateObject(viewer, 'all')
      // 销毁viewer
      viewer.destroy()
    }
  }

  /**
   * 坐标转换辅助函数
   */
  convertPosition(pos: Cartesian3 | [number, number, number]): Cartesian3 {
    return Array.isArray(pos) ? Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0) : pos
  }

  /**
   * 位置数组转换辅助函数
   */
  convertPositionArray(positions: (Cartesian3 | [number, number, number])[]): Cartesian3[] {
    return positions.map((pos) => this.convertPosition(pos))
  }

  /**
   * 多边形层级处理辅助函数
   */
  #processHierarchy(
    hier: PolygonHierarchy | Cartesian3[] | [number, number][] | [number, number, number][],
  ): PolygonHierarchy {
    if (hier instanceof PolygonHierarchy) {
      return hier
    }

    if (!Array.isArray(hier) || hier.length < 3) {
      throw new Error('多边形层级必须是非空数组且至少 3 个顶点')
    }

    const positions = hier.map((pos) => {
      if (pos instanceof Cartesian3) {
        return pos
      }
      if (Array.isArray(pos) && pos.length >= 2) {
        return Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0)
      }
      throw new Error(
        `无效坐标格式：${JSON.stringify(pos)}，应为 [经, 纬] 或 [经, 纬, 高] 或 Cartesian3`,
      )
    })

    return new PolygonHierarchy(positions)
  }

  /**
   * 创建ConstantProperty包装器
   */
  #createConstantProperty(value: unknown): ConstantProperty {
    return new ConstantProperty(value)
  }
}
