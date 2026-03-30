/**
 * 行为模式分析器
 * 
 * 负责合并和分析多源行为数据
 */

import { Injectable } from '@nestjs/common'
import {
  BehaviorPattern,
  ManualBehaviorData,
  DataSourceType,
} from '../types/portrait.types'

/**
 * 行为模式分析输入
 */
export interface BehaviorAnalysisInput {
  chatRecords: Array<{
    avgResponseTime?: number
    activeHours?: Record<string, number>
    activeDays?: Record<string, number>
    messageCount?: number
    emojiUsageRate?: number
    topicKeywords?: string[]
  }>
  manualData?: ManualBehaviorData | null
  existingBehavior?: BehaviorPattern | null
}

@Injectable()
export class BehaviorPatternAnalyzer {
  /**
   * 合并多源行为数据
   */
  mergeBehaviorData(input: BehaviorAnalysisInput): BehaviorPattern {
    const { chatRecords, manualData, existingBehavior } = input

    // 如果有聊天记录，优先使用聊天记录数据
    if (chatRecords && chatRecords.length > 0) {
      return this.mergeFromChatRecords(chatRecords, existingBehavior)
    }

    // 否则使用手动数据
    if (manualData) {
      return this.mergeFromManualData(manualData, existingBehavior)
    }

    // 无数据时返回默认值
    return this.getDefaultBehavior(existingBehavior)
  }

  /**
   * 从聊天记录合并数据
   */
  private mergeFromChatRecords(
    chatRecords: Array<{
      avgResponseTime?: number
      activeHours?: Record<string, number>
      activeDays?: Record<string, number>
      messageCount?: number
      emojiUsageRate?: number
      topicKeywords?: string[]
    }>,
    existingBehavior?: BehaviorPattern | null
  ): BehaviorPattern {
    let totalMessages = 0
    let totalResponseTime = 0
    let responseTimeCount = 0
    let totalEmojiRate = 0
    const mergedActiveHours: Record<string, number> = {}
    const mergedActiveDays: Record<string, number> = {}
    const mergedKeywords: string[] = []

    for (const record of chatRecords) {
      totalMessages += record.messageCount || 0
      
      if (record.avgResponseTime) {
        totalResponseTime += record.avgResponseTime
        responseTimeCount++
      }
      
      totalEmojiRate += record.emojiUsageRate || 0

      // 合并活跃时段
      const hours = record.activeHours || {}
      for (const [hour, count] of Object.entries(hours)) {
        mergedActiveHours[hour] = (mergedActiveHours[hour] || 0) + count
      }

      // 合并活跃日期
      const days = record.activeDays || {}
      for (const [day, count] of Object.entries(days)) {
        mergedActiveDays[day] = (mergedActiveDays[day] || 0) + count
      }

      // 合并关键词
      const keywords = record.topicKeywords || []
      mergedKeywords.push(...keywords)
    }

    // 计算平均值
    const avgResponseTime = responseTimeCount > 0 
      ? Math.floor(totalResponseTime / responseTimeCount) 
      : null
    const avgEmojiRate = chatRecords.length > 0 
      ? Math.floor(totalEmojiRate / chatRecords.length) 
      : 0

    return {
      dataSource: 'chat_record' as DataSourceType,
      avgResponseTime,
      responseTimeVariance: null,
      activeHours: mergedActiveHours,
      activeDays: mergedActiveDays,
      messageLengthAvg: null,
      emojiUsageRate: avgEmojiRate,
      questionRate: existingBehavior?.questionRate || 0,
      initiativeRate: existingBehavior?.initiativeRate || 0,
      topicCategories: this.keywordsToCategories(mergedKeywords),
      emotionalKeywords: [...new Set(mergedKeywords)],
      totalInteractions: totalMessages,
    }
  }

  /**
   * 从手动数据合并
   */
  private mergeFromManualData(
    manualData: ManualBehaviorData,
    existingBehavior?: BehaviorPattern | null
  ): BehaviorPattern {
    return {
      dataSource: 'manual' as DataSourceType,
      avgResponseTime: this.responseSpeedToMinutes(manualData.responseSpeed),
      responseTimeVariance: null,
      activeHours: this.timeSlotsToHours(manualData.activeTimeSlots || []),
      activeDays: existingBehavior?.activeDays || {},
      messageLengthAvg: null,
      emojiUsageRate: 50,
      questionRate: 50,
      initiativeRate: 50,
      topicCategories: this.topicsToCategories(manualData.topicPreferences || []),
      emotionalKeywords: [],
      totalInteractions: existingBehavior?.totalInteractions || 0,
    }
  }

  /**
   * 获取默认行为数据
   */
  private getDefaultBehavior(existingBehavior?: BehaviorPattern | null): BehaviorPattern {
    return {
      dataSource: 'none' as DataSourceType,
      avgResponseTime: null,
      responseTimeVariance: null,
      activeHours: {},
      activeDays: {},
      messageLengthAvg: null,
      emojiUsageRate: 0,
      questionRate: existingBehavior?.questionRate || 0,
      initiativeRate: existingBehavior?.initiativeRate || 0,
      topicCategories: {},
      emotionalKeywords: [],
      totalInteractions: existingBehavior?.totalInteractions || 0,
    }
  }

  /**
   * 回复速度转换为分钟
   */
  private responseSpeedToMinutes(speed?: string): number | null {
    if (!speed) return null
    
    const speedMap: Record<string, number> = {
      instant: 1,
      fast: 10,
      normal: 30,
      slow: 120,
      very_slow: 480,
    }
    
    return speedMap[speed] || null
  }

  /**
   * 时间段转换为小时分布
   */
  private timeSlotsToHours(slots: string[]): Record<string, number> {
    const timeSlotMap: Record<string, number[]> = {
      morning: [6, 7, 8, 9, 10, 11],
      afternoon: [12, 13, 14, 15, 16, 17],
      evening: [18, 19, 20, 21],
      night: [22, 23, 0, 1, 2, 3, 4, 5],
    }

    const activeHours: Record<string, number> = {}
    
    for (const slot of slots) {
      const hours = timeSlotMap[slot] || []
      for (const hour of hours) {
        activeHours[hour.toString()] = 10
      }
    }

    return activeHours
  }

  /**
   * 关键词转换为话题分类
   */
  private keywordsToCategories(keywords: string[]): Record<string, number> {
    const categories: Record<string, number> = {}
    
    for (const keyword of keywords) {
      categories[keyword] = (categories[keyword] || 0) + 1
    }

    return categories
  }

  /**
   * 话题偏好转换为话题分类
   */
  private topicsToCategories(topics: string[]): Record<string, number> {
    const topicMap: Record<string, string> = {
      daily: '日常',
      work: '工作',
      emotion: '情感',
      hobby: '兴趣',
      future: '未来',
      relationship: '关系',
    }

    const categories: Record<string, number> = {}
    
    for (const topic of topics) {
      const categoryName = topicMap[topic] || topic
      categories[categoryName] = 10
    }

    return categories
  }

  /**
   * 提取活跃时段标签
   */
  extractActiveTimeSlots(activeHours: Record<string, number>): string[] {
    const slots: string[] = []
    const hours = Object.entries(activeHours)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => parseInt(h))

    hours.forEach(h => {
      if (h >= 6 && h < 12) slots.push('上午')
      else if (h >= 12 && h < 18) slots.push('下午')
      else if (h >= 18 && h < 22) slots.push('晚上')
      else slots.push('深夜')
    })

    return [...new Set(slots)]
  }

  /**
   * 计算互动风格
   */
  calculateInteractionStyle(behavior: BehaviorPattern): 'active' | 'passive' | 'balanced' {
    if (behavior.initiativeRate >= 60) return 'active'
    if (behavior.initiativeRate <= 30) return 'passive'
    return 'balanced'
  }
}
