import { defineStore } from 'pinia'
import type { Viewer } from 'cesium'
import { ref } from 'vue'

export const useCesiumStore = defineStore('cesium', () => {
  // 响应式存储 viewer 实例
  const viewer = ref<Viewer | null>(null)

  const setViewer = (viewerInstance: Viewer | null) => {
    // 销毁旧实例，避免内存泄漏
    if (viewer.value) {
      viewer.value.destroy()
    }
    viewer.value = viewerInstance
  }

  const getViewer = () => viewer

  return { viewer, setViewer, getViewer }
})
