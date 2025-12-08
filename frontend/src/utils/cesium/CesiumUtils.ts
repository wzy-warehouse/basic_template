import type { CesiumInitOptions } from '@/types/cesium/CesiumInitOptions'
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
} from 'cesium'
import config from '@/config/config.json'
import type { EntityOptions } from '@/types/cesium/EntityOptions'
import type { PrimitiveOptions } from '@/types/cesium/PrimitiveOptions'

// 坐标转换辅助函数
const convertPosition = (pos: Cartesian3 | [number, number, number]): Cartesian3 => {
  return Array.isArray(pos) ? Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0) : pos
}

// 位置数组转换辅助函数
const convertPositionArray = (
  positions: (Cartesian3 | [number, number, number])[],
): Cartesian3[] => {
  return positions.map(convertPosition)
}

// 多边形层级处理辅助函数
const processHierarchy = (
  hier: PolygonHierarchy | Cartesian3[] | [number, number][] | [number, number, number][],
): PolygonHierarchy => {
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

// 创建属性包装器
const createConstantProperty = (value: unknown): ConstantProperty => {
  return new ConstantProperty(value)
}

export const CesiumUtils = {
  /**
   * 存储所有primitive的映射关系
   * key: id, value: primitive实例
   */
  primitiveMap: new Map<string, Primitive | BillboardCollection>(),

  /**
   * 初始化 Cesium Viewer 实例
   * @description 封装默认配置，支持自定义扩展，返回 Viewer 实例供全局使用
   * @param options - 初始化配置项
   * @param tdMapToken - 天地图服务 token
   * @param type - 底图类型：0 - 天地图「影像底图 + 影像注记」其他 - 天地图「纯矢量底图」（无注记）
   * @returns Viewer 实例
   */
  initCesiumViewer: (options: CesiumInitOptions, tdMapToken?: string[], type: number = 0): Viewer => {
    // 使用Cesium官方示例中的Token
    Ion.defaultAccessToken = config.cesiumIonDefaultAccessToken

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
          failIfMajorPerformanceCaveat: true
        },
        allowTextureFilterAnisotropic: true
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
    CesiumUtils.imageryProvider(type, tdMapToken).forEach((imageryProvider) => {
      viewer.imageryLayers.addImageryProvider(imageryProvider)
    })

    return viewer
  },

  /**
   * 添加底图
   * @param type - 底图类型：0 - 天地图影像；1 - 内网自定义瓦片底图；其他 - 天地图「纯矢量底图」（无注记）
   * @param tdMapToken - 天地图token
   * @returns ImageryProvider 实例
   */
  imageryProvider: (type: number, tdMapToken: string[]): ImageryProvider[] => {
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
      // 当前token
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
  },

  /**
   * 添加实体到场景
   * @description 统一处理点、线、Billboard 实体的创建，支持自定义属性
   * @param viewer - Cesium Viewer 实例
   * @param entityOptions - 实体配置项（必传 id、position、type）
   * @returns 创建的 Entity 实例
   */
  addCesiumEntity: (viewer: Viewer, entityOptions: EntityOptions): Entity => {
    const { id, position, type, attributes = {} } = entityOptions

    if (!id) throw new Error('实体 id 为必填项')
    if (!position) throw new Error('实体 position 为必填项')

    // 实体基础配置
    const entity = new Entity({
      id,
      position: convertPosition(position),
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
          positions: convertPositionArray(positions),
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
          hierarchy: createConstantProperty(processHierarchy(hierarchy)),
          material: new ColorMaterialProperty(color),
          outline: createConstantProperty(outline),
          outlineColor: createConstantProperty(outlineColor),
          outlineWidth: createConstantProperty(outlineWidth),
          height: createConstantProperty(height),
          extrudedHeight:
            extrudedHeight !== undefined ? createConstantProperty(extrudedHeight) : undefined,
          perPositionHeight: createConstantProperty(perPositionHeight),
        })
        break
      }
      default:
        throw new Error(`不支持的实体类型：${type}`)
    }

    // 添加到场景
    viewer.entities.add(entity)
    return entity
  },

  /**
   * 坐标转换
   */
  convertPosition: (pos: Cartesian3 | [number, number, number]): Cartesian3 => {
    return convertPosition(pos)
  },

  /**
   * 处理多边形层级
   */
  processHierarchy: (
    hier: PolygonHierarchy | Cartesian3[] | [number, number][] | [number, number, number][],
  ): PolygonHierarchy => {
    return processHierarchy(hier)
  },

  /**
   * 位置数组转换
   */
  convertPositionArray: (positions: (Cartesian3 | [number, number, number])[]): Cartesian3[] => {
    return convertPositionArray(positions)
  },

  /**
   * 根据 ID 删除实体
   * @description 安全删除实体（不存在时不报错）
   * @param viewer - Cesium Viewer 实例
   * @param entityId - 实体 ID
   */
  removeCesiumEntity: (viewer: Viewer, entityId: string): void => {
    const entity = viewer.entities.getById(entityId)
    if (entity) {
      viewer.entities.remove(entity)
    }
  },

  /**
   * 定位视角到目标位置
   * @description 支持经纬度数组或 Cartesian3，可配置飞行时间
   * @param viewer - Cesium Viewer 实例
   * @param target - 目标位置（经纬度高程数组 或 Cartesian3）
   * @param duration - 飞行时间（秒，默认：2）
   */
  flyToTarget: (
    viewer: Viewer,
    target: [number, number, number] | Cartesian3,
    duration = 2,
  ): void => {
    const position = convertPosition(target)
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        (Cartographic.fromCartesian(position).longitude * 180) / Math.PI,
        (Cartographic.fromCartesian(position).latitude * 180) / Math.PI,
        Cartographic.fromCartesian(position).height,
      ),
      duration,
    })
  },

  /**
   * 调整视角
   * @param viewer - Cesium Viewer 实例
   * @param target - 目标位置（经纬度高程数组 或 Cartesian3）
   */
  viewToTarget: (viewer: Viewer, target: [number, number, number] | Cartesian3) => {
    const position = convertPosition(target)
    viewer.camera.setView({
      destination: position,
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-90),
        roll: 0.0,
      },
    })
  },

  /**
   * 清除所有实体
   * @description 快速清空场景中所有自定义实体（保留基础图层）
   * @param viewer - Cesium Viewer 实例
   */
  clearAllEntities: (viewer: Viewer): void => {
    viewer.entities.removeAll()
  },

  /**
   * 根据 ID 查询实体
   * @description 安全查询实体（不存在时返回 null）
   * @param viewer - Cesium Viewer 实例
   * @param entityId - 实体 ID
   * @returns Entity 实例或 null
   */
  getCesiumEntityById: (viewer: Viewer, entityId: string): Entity | null => {
    return viewer.entities.getById(entityId) || null
  },

  /**
   * 销毁 Cesium 实例
   * @description 释放内存，避免内存泄漏（页面卸载时调用）
   * @param viewer - Cesium Viewer 实例
   */
  destroyCesiumViewer: (viewer: Viewer): void => {
    if (viewer) {
      viewer.entities.removeAll()
      viewer.destroy()
    }
  },

  /**
   * 批量添加Primitive类型的点线面和广告牌
   * @param viewer - Cesium Viewer实例
   * @param primitives - 要添加的primitive数组
   */
  addPrimitivesBatch: function (viewer: Viewer, primitives: PrimitiveOptions[]): void {
    // 按类型分组处理，提高渲染性能
    const pointOptions: PrimitiveOptions[] = []
    const polylineOptions: PrimitiveOptions[] = []
    const polygonOptions: PrimitiveOptions[] = []
    const billboardOptions: PrimitiveOptions[] = []

    // 分组
    primitives.forEach((option) => {
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
      // 创建外观并显式获取其vertexFormat
      const appearance = new PerInstanceColorAppearance({
        translucent: false,
        closed: true,
      })

      const instances = pointOptions.map((option) => {
        const firstPosition = option.positions?.[0]
        if (!firstPosition) {
          throw new Error('positions 数组为空或首项缺失')
        }
        const position = CesiumUtils.convertPosition(firstPosition)
        return new GeometryInstance({
          id: option.id,
          geometry: new CircleGeometry({
            center: position,
            radius: option.pixelSize || 8,
            // 使用外观的vertexFormat确保匹配
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

      pointOptions.forEach((option) => {
        this.primitiveMap.set(option.id, pointPrimitive)
      })
    }

    // 处理线
    if (polylineOptions.length > 0) {
      const appearance = new PolylineColorAppearance({
        translucent: true,
      })

      const instances = polylineOptions.map((option) => {
        const positions = CesiumUtils.convertPositionArray(option.positions)
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

      polylineOptions.forEach((option) => {
        this.primitiveMap.set(option.id, polylinePrimitive)
      })
    }

    // 处理面
    if (polygonOptions.length > 0) {
      const appearance = new PerInstanceColorAppearance({
        translucent: true,
        closed: true,
      })

      const instances = polygonOptions.map((option) => {
        const positions = CesiumUtils.convertPositionArray(option.positions)
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
          translucent: true, // 支持半透明
          closed: true, // 多边形是闭合图形
        }),
        asynchronous: false,
      })

      viewer.scene.primitives.add(polygonPrimitive)

      polygonOptions.forEach((option) => {
        this.primitiveMap.set(option.id, polygonPrimitive)
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
        const position = CesiumUtils.convertPosition(firstPosition)
        billboardCollection.add({
          id: option.id,
          position,
          image: option.image,
          scale: option.scale || 1,
          color: option.color || Color.WHITE,
        })
      })

      viewer.scene.primitives.add(billboardCollection)

      billboardOptions.forEach((option) => {
        this.primitiveMap.set(option.id, billboardCollection)
      })
    }
  },

  /**
   * 根据ID获取primitive
   * @param id - primitive的ID
   * @returns 对应的primitive或广告牌集合
   */
  getPrimitiveById: function (id: string): Primitive | BillboardCollection | undefined {
    return this.primitiveMap.get(id)
  },

  /**
   * 清除所有primitive
   * @param viewer - Cesium Viewer实例
   */
  clearAllPrimitives: function (viewer: Viewer): void {
    viewer.scene.primitives.removeAll()
    this.primitiveMap.clear()
  },
}
