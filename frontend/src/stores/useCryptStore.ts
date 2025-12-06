import { defineStore } from 'pinia'
import { type Ref, ref } from 'vue'

export const useCryptStore = defineStore('crypt', () => {
  // sm2公钥
  const sm2PublicKey: Ref<string> = ref('')

  return { sm2PublicKey }
})
