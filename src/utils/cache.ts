/**
 * 数据缓存工具
 * 用于缓存维度数据，减少网络请求，提升页面加载速度
 */

import Taro from '@tarojs/taro'

// 缓存版本号 - 当维度定义更新时需要更新此版本号
const CACHE_VERSION = 'v2_20250402'

// 缓存配置
const CACHE_CONFIG = {
  // 缓存过期时间（毫秒）
  DIMENSION_DATA: 5 * 60 * 1000, // 5分钟
  MATCH_DETAIL: 2 * 60 * 1000, // 2分钟
}

// 缓存键名（带版本号）
const CACHE_KEYS = {
  DIMENSION_DATA: (matchId: number) => `dimension_data_${matchId}_${CACHE_VERSION}`,
  MATCH_DETAIL: (matchId: number) => `match_detail_${matchId}_${CACHE_VERSION}`,
}

interface CacheData<T> {
  data: T
  timestamp: number
  expireTime: number
  version: string
}

/**
 * 设置缓存
 */
export const setCache = async <T>(key: string, data: T, expireTime: number): Promise<void> => {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
      expireTime,
      version: CACHE_VERSION,
    }
    await Taro.setStorageSync(key, JSON.stringify(cacheData))
  } catch (err) {
    console.error('设置缓存失败:', err)
  }
}

/**
 * 获取缓存
 * 返回 null 表示缓存不存在或已过期
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cacheStr = await Taro.getStorageSync(key)
    if (!cacheStr) return null

    const cacheData: CacheData<T> = JSON.parse(cacheStr)
    
    // 检查版本是否匹配
    if (cacheData.version !== CACHE_VERSION) {
      await Taro.removeStorageSync(key)
      return null
    }
    
    // 检查是否过期
    if (Date.now() - cacheData.timestamp > cacheData.expireTime) {
      // 清除过期缓存
      await Taro.removeStorageSync(key)
      return null
    }
    
    return cacheData.data
  } catch (err) {
    console.error('获取缓存失败:', err)
    return null
  }
}

/**
 * 清除指定缓存
 */
export const removeCache = async (key: string): Promise<void> => {
  try {
    await Taro.removeStorageSync(key)
  } catch (err) {
    console.error('清除缓存失败:', err)
  }
}

/**
 * 清除所有维度相关缓存
 */
export const clearDimensionCache = async (matchId?: number): Promise<void> => {
  try {
    if (matchId) {
      // 清除当前版本的缓存
      Taro.removeStorageSync(CACHE_KEYS.DIMENSION_DATA(matchId))
      Taro.removeStorageSync(CACHE_KEYS.MATCH_DETAIL(matchId))
    } else {
      // 清除所有版本的维度相关缓存
      const info = Taro.getStorageInfoSync()
      const keys = (info as unknown as { keys: string[] }).keys || []
      for (const key of keys) {
        // 匹配所有版本的缓存键
        if (key.startsWith('dimension_data_') || key.startsWith('match_detail_')) {
          Taro.removeStorageSync(key)
        }
      }
    }
  } catch (err) {
    console.error('清除维度缓存失败:', err)
  }
}

/**
 * 获取维度数据（带缓存）
 * 优先返回缓存数据，后台静默更新
 */
export const getDimensionDataWithCache = async <T>(
  matchId: number,
  fetcher: () => Promise<T>
): Promise<{ data: T | null; fromCache: boolean }> => {
  const cacheKey = CACHE_KEYS.DIMENSION_DATA(matchId)
  
  // 尝试获取缓存
  const cachedData = await getCache<T>(cacheKey)
  
  if (cachedData) {
    // 有缓存，立即返回，后台静默更新
    fetcher().then(async (freshData) => {
      await setCache(cacheKey, freshData, CACHE_CONFIG.DIMENSION_DATA)
    }).catch(err => {
      console.error('后台更新缓存失败:', err)
    })
    
    return { data: cachedData, fromCache: true }
  }
  
  // 无缓存，直接获取
  const freshData = await fetcher()
  await setCache(cacheKey, freshData, CACHE_CONFIG.DIMENSION_DATA)
  
  return { data: freshData, fromCache: false }
}

/**
 * 获取对象详情（带缓存）
 */
export const getMatchDetailWithCache = async <T>(
  matchId: number,
  fetcher: () => Promise<T>
): Promise<{ data: T | null; fromCache: boolean }> => {
  const cacheKey = CACHE_KEYS.MATCH_DETAIL(matchId)
  
  const cachedData = await getCache<T>(cacheKey)
  
  if (cachedData) {
    fetcher().then(async (freshData) => {
      await setCache(cacheKey, freshData, CACHE_CONFIG.MATCH_DETAIL)
    }).catch(err => {
      console.error('后台更新缓存失败:', err)
    })
    
    return { data: cachedData, fromCache: true }
  }
  
  const freshData = await fetcher()
  await setCache(cacheKey, freshData, CACHE_CONFIG.MATCH_DETAIL)
  
  return { data: freshData, fromCache: false }
}

export { CACHE_KEYS, CACHE_CONFIG }
