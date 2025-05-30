import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import service from '@/api/request'
function initState() {
  return {
    isCollapse: false,
    menuList: [],
  }
}

export const useAllDataStore = defineStore('allData', () => {
  const state = ref(initState())

  return { state }
})
