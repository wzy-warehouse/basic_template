import { defineStore } from 'pinia'
import { type Ref, ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const username: Ref<string> = ref('')
  const token: Ref<string> = ref('')
  const id: Ref<number> = ref(0)
  const isLogin: Ref<boolean> = ref(false)

  return { username, token, id, isLogin }
})
