/**
 * 骨架屏组件
 * 用于数据加载时展示占位效果，提升用户体验
 */

import { View } from '@tarojs/components'
import type { FC } from 'react'

interface SkeletonProps {
  className?: string
}

// 基础骨架块
export const Skeleton: FC<SkeletonProps> = ({ className = '' }) => (
  <View className={`bg-gray-200 animate-pulse rounded ${className}`} />
)

// 文本骨架
export const SkeletonText: FC<{ width?: string; lines?: number; className?: string }> = ({ 
  width = 'w-full', 
  lines = 1,
  className = '' 
}) => (
  <View className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <View 
        key={i}
        className={`bg-gray-200 animate-pulse rounded h-4 ${i === lines - 1 && lines > 1 ? width : 'w-full'}`}
      />
    ))}
  </View>
)

// 卡片骨架
export const SkeletonCard: FC<{ className?: string }> = ({ className = '' }) => (
  <View className={`bg-white rounded-xl border border-gray-100 p-4 ${className}`}>
    <View className="flex items-center justify-between mb-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-4 w-16" />
    </View>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4" />
  </View>
)

// 维度骨架
export const SkeletonDimension: FC<{ count?: number }> = ({ count = 5 }) => (
  <View className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} className="flex items-center justify-between py-3 px-3 bg-white border-b border-gray-50">
        <View className="flex items-center gap-2">
          <Skeleton className="h-1 w-1 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </View>
        <View className="flex items-center gap-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-3 rounded" />
        </View>
      </View>
    ))}
  </View>
)

// 维度层级骨架
export const SkeletonDimensionLayer: FC = () => (
  <View className="mb-3">
    {/* 层级标题 */}
    <View className="bg-white rounded-xl border border-gray-100 p-3 mb-2">
      <View className="flex items-center justify-between">
        <View className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-10 rounded-full" />
        </View>
        <Skeleton className="h-4 w-16" />
      </View>
      <Skeleton className="h-3 w-32 mt-2" />
    </View>
    
    {/* 分类 */}
    <View className="bg-gray-50 rounded-lg p-3 mb-2">
      <View className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-8" />
      </View>
    </View>
    
    {/* 维度列表 */}
    <View className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <SkeletonDimension count={4} />
    </View>
  </View>
)

// 档案页面骨架
export const SkeletonProfile: FC = () => (
  <View className="min-h-screen bg-gray-50 pb-24">
    {/* 头部信息 */}
    <View className="p-4">
      <View className="bg-white rounded-xl border border-gray-100 p-4">
        <View className="flex items-center gap-2 mb-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </View>
        <Skeleton className="h-4 w-32" />
      </View>
    </View>
    
    {/* 快捷操作 */}
    <View className="px-4 pb-4">
      <View className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} className="flex flex-col items-center p-3 bg-white rounded-xl border border-gray-100">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-3 w-12 mt-2" />
          </View>
        ))}
      </View>
    </View>
    
    {/* 数据概览 */}
    <View className="px-4 pb-4">
      <SkeletonCard />
    </View>
    
    {/* 维度数据 */}
    <View className="px-4 pb-4">
      <View className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-5 w-20" />
      </View>
      
      {/* 维度统计 */}
      <View className="mb-4 p-3 bg-white rounded-xl border border-gray-100">
        <View className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <View className="flex items-center gap-1">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-3 w-12" />
          </View>
        </View>
        <Skeleton className="h-1 w-full mt-2 rounded-full" />
      </View>
      
      {/* 层级骨架 */}
      <SkeletonDimensionLayer />
      <SkeletonDimensionLayer />
    </View>
    
    {/* 备注 */}
    <View className="px-4 pb-4">
      <Skeleton className="h-5 w-12 mb-2" />
      <SkeletonCard />
    </View>
  </View>
)

export default Skeleton
