/**
 * 策略推荐器
 * 
 * 基于双方画像推荐互动策略
 */

import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import {
  StrategyRecommendationResult,
  InteractionStrategy,
  PortraitDimensions,
  BehaviorPattern,
  UserPortraitSummary,
  IPredictor,
} from '../types/portrait.types'
import { BehaviorPatternAnalyzer } from '../analyzers/behavior-pattern.analyzer'

/**
 * 策略推荐输入
 */
export interface StrategyRecommendationInput {
  targetDimensions: Partial<PortraitDimensions>
  targetBehavior: BehaviorPattern | null
  userPortrait: UserPortraitSummary | null
  relationshipContext: {
    interactionStatus: string
    relationshipStage: string
  }
  matchInfo: {
    name: string
    hardware?: Record<string, unknown>
    software?: Record<string, unknown>
  }
  dataSourceInfo: {
    hasChatRecords: boolean
    dataSource: string
  }
  request: Request
}

@Injectable()
export class StrategyRecommender implements IPredictor<StrategyRecommendationInput, StrategyRecommendationResult> {
  constructor(private readonly behaviorAnalyzer: BehaviorPatternAnalyzer) {}

  /**
   * 推荐互动策略
   */
  async predict(input: StrategyRecommendationInput): Promise<StrategyRecommendationResult> {
    const { 
      targetDimensions, 
      targetBehavior, 
      userPortrait, 
      relationshipContext,
      matchInfo,
      dataSourceInfo,
      request 
    } = input

    // 检查数据是否充足
    if (!targetDimensions || dataSourceInfo.dataSource === 'none') {
      return this.getInsufficientDataResult()
    }

    try {
      // 使用LLM进行深度分析
      const llmResult = await this.recommendWithLLM(
        targetDimensions,
        targetBehavior,
        userPortrait,
        relationshipContext,
        matchInfo,
        dataSourceInfo,
        request
      )

      return llmResult
    } catch (error) {
      console.error('Strategy recommendation error:', error)
      return this.getFallbackStrategies(targetDimensions, targetBehavior)
    }
  }

  /**
   * 使用LLM推荐策略
   */
  private async recommendWithLLM(
    targetDimensions: Partial<PortraitDimensions>,
    targetBehavior: BehaviorPattern | null,
    userPortrait: UserPortraitSummary | null,
    relationshipContext: { interactionStatus: string; relationshipStage: string },
    matchInfo: { name: string; hardware?: Record<string, unknown>; software?: Record<string, unknown> },
    dataSourceInfo: { hasChatRecords: boolean; dataSource: string },
    request: Request
  ): Promise<StrategyRecommendationResult> {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const prompt = this.buildRecommendationPrompt(
      targetDimensions,
      targetBehavior,
      userPortrait,
      relationshipContext,
      matchInfo,
      dataSourceInfo
    )

    const response = await client.invoke([
      { role: 'user', content: prompt }
    ], { temperature: 0.7 })

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as StrategyRecommendationResult
    }

    return this.getFallbackStrategies(targetDimensions, targetBehavior)
  }

  /**
   * 构建推荐提示词
   */
  private buildRecommendationPrompt(
    targetDimensions: Partial<PortraitDimensions>,
    targetBehavior: BehaviorPattern | null,
    userPortrait: UserPortraitSummary | null,
    relationshipContext: { interactionStatus: string; relationshipStage: string },
    matchInfo: { name: string; hardware?: Record<string, unknown>; software?: Record<string, unknown> },
    dataSourceInfo: { hasChatRecords: boolean; dataSource: string }
  ): string {
    const userDesc = this.buildUserDescription(userPortrait)
    const targetDesc = this.buildTargetDescription(targetDimensions)
    const behaviorDesc = this.buildBehaviorDescription(targetBehavior, dataSourceInfo)
    const activeSlots = targetBehavior 
      ? this.behaviorAnalyzer.extractActiveTimeSlots(targetBehavior.activeHours)
      : []

    return `基于双方画像和行为数据，推荐最佳的互动策略。

数据来源：${dataSourceInfo.hasChatRecords ? '聊天记录分析' : '手动填写'}

对方（${matchInfo.name}）的画像特征：
${targetDesc}

${userDesc}

${behaviorDesc}

关系状态：${relationshipContext.interactionStatus}

请根据双方的画像特点，推荐3-5个具体的互动策略。策略要结合双方的性格匹配度，给出有针对性的建议。

返回JSON格式：
{
  "strategies": [
    {
      "category": "沟通/约会/话题/关怀",
      "action": "具体行动",
      "reason": "推荐理由",
      "timing": "最佳时机"
    }
  ]
}`
  }

  /**
   * 构建用户画像描述
   */
  private buildUserDescription(userPortrait: UserPortraitSummary | null): string {
    if (!userPortrait) return ''

    const traits = userPortrait.personality?.traits?.join('、') || '未知'
    const topics = userPortrait.behavior?.preferredTopics?.join('、') || '未知'
    
    return `用户（你）的画像：
- 性格特点: ${traits}
- 外向性: ${userPortrait.personality?.extraversion || 50}
- 沟通风格: ${userPortrait.behavior?.communicationStyle || '未知'}
- 表达风格: ${userPortrait.behavior?.expressionStyle || '未知'}
- 喜欢的话题: ${topics}
- 恋爱目标: ${userPortrait.relationship?.goal || '未知'}`
  }

  /**
   * 构建目标画像描述
   */
  private buildTargetDescription(dimensions: Partial<PortraitDimensions>): string {
    const lines: string[] = []

    if (dimensions.personality) {
      lines.push(`- 外向性: ${dimensions.personality.extraversion}`)
      lines.push(`- 宜人性: ${dimensions.personality.agreeableness}`)
    }

    if (dimensions.emotional) {
      lines.push(`- 情绪稳定性: ${dimensions.emotional.stability}`)
      lines.push(`- 共情能力: ${dimensions.emotional.empathy}`)
    }

    if (dimensions.communication) {
      lines.push(`- 沟通直接度: ${dimensions.communication.directness}`)
    }

    return lines.join('\n')
  }

  /**
   * 构建行为描述
   */
  private buildBehaviorDescription(
    behavior: BehaviorPattern | null,
    dataSourceInfo: { hasChatRecords: boolean }
  ): string {
    if (!behavior) return ''

    const activeSlots = this.behaviorAnalyzer.extractActiveTimeSlots(behavior.activeHours)
    
    if (dataSourceInfo.hasChatRecords) {
      return `对方行为特征：
- 活跃时段: ${activeSlots.join('、') || '未知'}
- 平均回复时间: ${behavior.avgResponseTime || '未知'}分钟`
    }

    return ''
  }

  /**
   * 数据不足时的默认结果
   */
  private getInsufficientDataResult(): StrategyRecommendationResult {
    return {
      strategies: [
        {
          category: '数据',
          action: '上传聊天记录或填写行为数据',
          reason: '缺少对方的行为数据，无法提供个性化建议',
          timing: '现在',
        }
      ]
    }
  }

  /**
   * 降级策略
   */
  private getFallbackStrategies(
    dimensions: Partial<PortraitDimensions>,
    behavior: BehaviorPattern | null
  ): StrategyRecommendationResult {
    const strategies: InteractionStrategy[] = []

    // 基于外向性推荐
    if (dimensions.personality?.extraversion !== undefined) {
      if (dimensions.personality.extraversion > 60) {
        strategies.push({
          category: '话题',
          action: '可以尝试更开放的话题',
          reason: '对方外向性较高，喜欢分享和交流',
          timing: '对方活跃时段',
        })
      } else {
        strategies.push({
          category: '话题',
          action: '选择深度话题进行交流',
          reason: '对方偏内向，更喜欢深度交流',
          timing: '安静的晚上',
        })
      }
    }

    // 基于情绪稳定性推荐
    if (dimensions.emotional?.stability !== undefined && dimensions.emotional.stability < 50) {
      strategies.push({
        category: '关怀',
        action: '多关注对方情绪，及时给予支持',
        reason: '对方情绪较敏感，需要更多关心',
        timing: '察觉情绪变化时',
      })
    }

    // 基于活跃时段推荐
    if (behavior) {
      const activeSlots = this.behaviorAnalyzer.extractActiveTimeSlots(behavior.activeHours)
      if (activeSlots.length > 0) {
        strategies.push({
          category: '沟通',
          action: `在${activeSlots[0]}时段主动发起聊天`,
          reason: '这是对方最活跃的时间段',
          timing: activeSlots[0],
        })
      }
    }

    // 如果没有生成任何策略，添加默认策略
    if (strategies.length === 0) {
      strategies.push({
        category: '沟通',
        action: '保持适度的联系频率',
        reason: '稳定的互动有助于关系发展',
        timing: '每天固定时间',
      })
    }

    return { strategies }
  }
}
