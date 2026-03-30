/**
 * 画像计算器
 * 
 * 负责根据行为数据计算画像维度，支持多源数据合并
 */

import { Injectable } from '@nestjs/common'
import {
  PortraitDimensions,
  BehaviorPattern,
  ManualBehaviorData,
  DataSourceStatus,
  IPortraitCalculator,
} from '../types/portrait.types'

@Injectable()
export class PortraitCalculator implements IPortraitCalculator {
  /**
   * 根据行为数据计算画像维度
   */
  calculateFromBehavior(behavior: BehaviorPattern): Partial<PortraitDimensions> {
    const dimensions: Partial<PortraitDimensions> = {}

    // 基于回复时间计算外向性
    if (behavior.avgResponseTime !== null) {
      dimensions.personality = {
        openness: 50,
        conscientiousness: 50,
        extraversion: this.calculateExtraversionFromResponseTime(behavior.avgResponseTime),
        agreeableness: 50,
        neuroticism: 50,
      }
    }

    // 基于主动性计算社交维度
    if (behavior.initiativeRate > 0) {
      dimensions.social = {
        activity: Math.min(100, behavior.totalInteractions / 10),
        initiative: behavior.initiativeRate,
        intimacy: 50,
        trust: 50,
      }
    }

    // 基于话题偏好计算开放性
    const topicCount = Object.keys(behavior.topicCategories).length
    if (topicCount > 0 && dimensions.personality) {
      dimensions.personality.openness = Math.min(100, topicCount * 15 + 30)
    } else if (topicCount > 0) {
      dimensions.personality = {
        openness: Math.min(100, topicCount * 15 + 30),
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
      }
    }

    // 基于表情使用率计算情感表达
    if (behavior.emojiUsageRate > 0) {
      dimensions.emotional = {
        stability: 50,
        expression: Math.min(100, behavior.emojiUsageRate + 20),
        empathy: 50,
        independence: 50,
      }
    }

    // 基于提问率计算沟通维度
    if (behavior.questionRate > 0) {
      dimensions.communication = {
        directness: 50,
        responsiveness: behavior.questionRate,
        humor: 50,
        depth: Math.min(100, behavior.questionRate + 20),
      }
    }

    return dimensions
  }

  /**
   * 合并多源数据计算画像
   */
  mergeFromSources(
    chatData: Partial<BehaviorPattern>,
    manualData: ManualBehaviorData
  ): Partial<PortraitDimensions> {
    const dimensions: Partial<PortraitDimensions> = {}

    // 优先使用聊天记录数据
    if (chatData.avgResponseTime !== null && chatData.avgResponseTime !== undefined) {
      dimensions.personality = {
        openness: 50,
        conscientiousness: 50,
        extraversion: this.calculateExtraversionFromResponseTime(chatData.avgResponseTime),
        agreeableness: 50,
        neuroticism: 50,
      }
    } else if (manualData.responseSpeed) {
      // 降级使用手动数据
      dimensions.personality = {
        openness: 50,
        conscientiousness: 50,
        extraversion: this.calculateExtraversionFromManualSpeed(manualData.responseSpeed),
        agreeableness: 50,
        neuroticism: 50,
      }
    }

    // 合并活跃时段
    const chatSlots = this.extractActiveSlots(chatData.activeHours || {})
    const manualSlots = manualData.activeTimeSlots || []
    const mergedSlots = [...new Set([...chatSlots, ...manualSlots])]
    
    if (mergedSlots.length > 0) {
      dimensions.social = {
        activity: Math.min(100, mergedSlots.length * 25),
        initiative: 50,
        intimacy: 50,
        trust: 50,
      }
    }

    // 合并话题偏好
    const chatTopics = Object.keys(chatData.topicCategories || {})
    const manualTopics = manualData.topicPreferences || []
    const mergedTopics = [...new Set([...chatTopics, ...manualTopics])]
    
    if (mergedTopics.length > 0) {
      if (dimensions.personality) {
        dimensions.personality.openness = Math.min(100, mergedTopics.length * 15 + 30)
      } else {
        dimensions.personality = {
          openness: Math.min(100, mergedTopics.length * 15 + 30),
          conscientiousness: 50,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 50,
        }
      }
    }

    // 沟通风格
    if (manualData.communicationStyle) {
      dimensions.communication = {
        directness: this.calculateDirectnessFromStyle(manualData.communicationStyle),
        responsiveness: 50,
        humor: 50,
        depth: 50,
      }
    }

    return dimensions
  }

  /**
   * 计算置信度
   */
  calculateConfidence(
    dataSource: DataSourceStatus,
    behavior: BehaviorPattern
  ): number {
    let confidence = 0

    // 聊天记录数据权重更高
    if (dataSource.hasChatRecords) {
      // 基于聊天记录数量
      const recordWeight = Math.min(40, dataSource.chatRecordCount * 10)
      // 基于消息数量
      const messageWeight = Math.min(30, behavior.totalInteractions / 10)
      confidence = recordWeight + messageWeight
    }

    // 手动数据补充
    if (dataSource.hasManualData) {
      confidence = Math.min(100, confidence + 20)
    }

    return Math.min(100, confidence)
  }

  /**
   * 根据回复时间计算外向性
   * 回复越快，外向性越高
   */
  private calculateExtraversionFromResponseTime(avgResponseTime: number): number {
    // 1分钟内 -> 90, 10分钟 -> 70, 30分钟 -> 50, 2小时 -> 30, 8小时+ -> 20
    if (avgResponseTime <= 1) return 90
    if (avgResponseTime <= 10) return 70
    if (avgResponseTime <= 30) return 50
    if (avgResponseTime <= 120) return 35
    return 20
  }

  /**
   * 根据手动填写的回复速度计算外向性
   */
  private calculateExtraversionFromManualSpeed(speed: string): number {
    const speedMap: Record<string, number> = {
      instant: 95,
      fast: 75,
      normal: 50,
      slow: 30,
      very_slow: 15,
    }
    return speedMap[speed] || 50
  }

  /**
   * 根据沟通风格计算直接程度
   */
  private calculateDirectnessFromStyle(style: string): number {
    const styleMap: Record<string, number> = {
      direct: 80,
      balanced: 50,
      indirect: 25,
    }
    return styleMap[style] || 50
  }

  /**
   * 从活跃小时数据中提取活跃时段
   */
  private extractActiveSlots(activeHours: Record<string, number>): string[] {
    const slots: string[] = []
    const hourEntries = Object.entries(activeHours)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)

    hourEntries.forEach(([hour]) => {
      const h = parseInt(hour)
      if (h >= 6 && h < 12) slots.push('morning')
      else if (h >= 12 && h < 18) slots.push('afternoon')
      else if (h >= 18 && h < 22) slots.push('evening')
      else slots.push('night')
    })

    return [...new Set(slots)]
  }

  /**
   * 计算性格特质标签
   */
  calculatePersonalityTraits(personality: {
    openness?: number
    extraversion?: number
    agreeableness?: number
    neuroticism?: number
  }): string[] {
    const traits: string[] = []

    if (personality.openness !== undefined) {
      if (personality.openness >= 70) traits.push('思维开放')
      else if (personality.openness <= 30) traits.push('稳重传统')
    }

    if (personality.extraversion !== undefined) {
      if (personality.extraversion >= 70) traits.push('外向活跃')
      else if (personality.extraversion <= 30) traits.push('内敛沉稳')
    }

    if (personality.agreeableness !== undefined) {
      if (personality.agreeableness >= 70) traits.push('温和友善')
      else if (personality.agreeableness <= 30) traits.push('有主见')
    }

    if (personality.neuroticism !== undefined) {
      if (personality.neuroticism >= 70) traits.push('情感细腻')
      else if (personality.neuroticism <= 30) traits.push('情绪稳定')
    }

    return traits
  }

  /**
   * 计算情感风格
   */
  calculateEmotionalStyle(emotional: {
    stability?: number
    expression?: number
    empathy?: number
  }): string {
    const scores: number[] = []
    
    if (emotional.stability !== undefined) scores.push(emotional.stability)
    if (emotional.expression !== undefined) scores.push(emotional.expression)
    if (emotional.empathy !== undefined) scores.push(emotional.empathy)

    if (scores.length === 0) return '未知'

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    
    if (avg >= 70) return '情感丰富'
    if (avg >= 50) return '平衡适中'
    return '理性内敛'
  }

  /**
   * 计算互动风格
   */
  calculateInteractionStyle(behavior: BehaviorPattern): 'active' | 'passive' | 'balanced' {
    if (behavior.initiativeRate >= 60) return 'active'
    if (behavior.initiativeRate <= 30) return 'passive'
    return 'balanced'
  }

  /**
   * 计算匹配度
   */
  calculateCompatibility(
    userDimensions: Partial<PortraitDimensions>,
    targetDimensions: Partial<PortraitDimensions>
  ): number {
    let totalScore = 0
    let dimensionCount = 0

    // 性格匹配
    if (userDimensions.personality && targetDimensions.personality) {
      const personalityScore = this.calculateDimensionMatch(
        userDimensions.personality as unknown as Record<string, number>,
        targetDimensions.personality as unknown as Record<string, number>
      )
      totalScore += personalityScore
      dimensionCount++
    }

    // 情感匹配
    if (userDimensions.emotional && targetDimensions.emotional) {
      const emotionalScore = this.calculateDimensionMatch(
        userDimensions.emotional as unknown as Record<string, number>,
        targetDimensions.emotional as unknown as Record<string, number>
      )
      totalScore += emotionalScore
      dimensionCount++
    }

    // 沟通匹配
    if (userDimensions.communication && targetDimensions.communication) {
      const communicationScore = this.calculateDimensionMatch(
        userDimensions.communication as unknown as Record<string, number>,
        targetDimensions.communication as unknown as Record<string, number>
      )
      totalScore += communicationScore
      dimensionCount++
    }

    // 社交匹配
    if (userDimensions.social && targetDimensions.social) {
      const socialScore = this.calculateDimensionMatch(
        userDimensions.social as unknown as Record<string, number>,
        targetDimensions.social as unknown as Record<string, number>
      )
      totalScore += socialScore
      dimensionCount++
    }

    return dimensionCount > 0 ? Math.round(totalScore / dimensionCount) : 50
  }

  /**
   * 计算单个维度的匹配度
   */
  private calculateDimensionMatch(
    userDim: Record<string, number>,
    targetDim: Record<string, number>
  ): number {
    const keys = new Set([...Object.keys(userDim), ...Object.keys(targetDim)])
    let totalDiff = 0
    let count = 0

    keys.forEach(key => {
      const userValue = userDim[key]
      const targetValue = targetDim[key]
      
      if (userValue !== undefined && targetValue !== undefined) {
        // 差异越小，分数越高
        const diff = Math.abs(userValue - targetValue)
        totalDiff += diff
        count++
      }
    })

    if (count === 0) return 50

    // 差异100时为0分，差异0时为100分
    const avgDiff = totalDiff / count
    return Math.max(0, Math.round(100 - avgDiff))
  }
}
