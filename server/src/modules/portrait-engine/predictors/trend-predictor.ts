/**
 * 关系趋势预测器
 * 
 * 基于双方画像数据预测关系走向
 */

import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import {
  TrendPredictionResult,
  RelationshipTrend,
  PortraitDimensions,
  BehaviorPattern,
  UserPortraitSummary,
  IPredictor,
} from '../types/portrait.types'
import { PortraitCalculator } from '../analyzers/portrait-calculator'

/**
 * 趋势预测输入
 */
export interface TrendPredictionInput {
  targetDimensions: Partial<PortraitDimensions>
  targetBehavior: BehaviorPattern | null
  userPortrait: UserPortraitSummary | null
  relationshipContext: {
    relationshipStage: string
    interactionStatus: string
  }
  dataSourceInfo: {
    hasChatRecords: boolean
    dataSource: string
  }
  request: Request
}

@Injectable()
export class TrendPredictor implements IPredictor<TrendPredictionInput, TrendPredictionResult> {
  constructor(private readonly calculator: PortraitCalculator) {}

  /**
   * 预测关系趋势
   */
  async predict(input: TrendPredictionInput): Promise<TrendPredictionResult> {
    const { 
      targetDimensions, 
      targetBehavior, 
      userPortrait, 
      relationshipContext,
      dataSourceInfo,
      request 
    } = input

    // 检查数据是否充足
    if (!targetDimensions || dataSourceInfo.dataSource === 'none') {
      return this.getInsufficientDataResult()
    }

    try {
      // 使用LLM进行深度分析
      const llmResult = await this.predictWithLLM(
        targetDimensions,
        targetBehavior,
        userPortrait,
        relationshipContext,
        dataSourceInfo,
        request
      )

      // 根据数据来源调整置信度
      if (!dataSourceInfo.hasChatRecords) {
        llmResult.confidence = Math.min(llmResult.confidence, 50)
      }

      return llmResult
    } catch (error) {
      console.error('Trend prediction error:', error)
      return this.getFallbackResult(targetDimensions, dataSourceInfo.dataSource)
    }
  }

  /**
   * 使用LLM预测
   */
  private async predictWithLLM(
    targetDimensions: Partial<PortraitDimensions>,
    targetBehavior: BehaviorPattern | null,
    userPortrait: UserPortraitSummary | null,
    relationshipContext: { relationshipStage: string; interactionStatus: string },
    dataSourceInfo: { hasChatRecords: boolean; dataSource: string },
    request: Request
  ): Promise<TrendPredictionResult> {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const prompt = this.buildPredictionPrompt(
      targetDimensions,
      targetBehavior,
      userPortrait,
      relationshipContext,
      dataSourceInfo
    )

    const response = await client.invoke([
      { role: 'user', content: prompt }
    ], { model: 'doubao-seed-2-0-pro-260215', temperature: 0.5 })

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as TrendPredictionResult
    }

    return this.getFallbackResult(targetDimensions, dataSourceInfo.dataSource)
  }

  /**
   * 构建预测提示词
   */
  private buildPredictionPrompt(
    targetDimensions: Partial<PortraitDimensions>,
    targetBehavior: BehaviorPattern | null,
    userPortrait: UserPortraitSummary | null,
    relationshipContext: { relationshipStage: string; interactionStatus: string },
    dataSourceInfo: { hasChatRecords: boolean; dataSource: string }
  ): string {
    const userDesc = this.buildUserDescription(userPortrait)
    const targetDesc = this.buildTargetDescription(targetDimensions, targetBehavior)
    const behaviorDesc = this.buildBehaviorDescription(targetBehavior, dataSourceInfo)

    return `基于以下数据，预测关系走向并给出建议。

数据来源：${dataSourceInfo.hasChatRecords ? '聊天记录分析' : '手动填写'}

对方（Ta）的画像数据：
${targetDesc}

${userDesc}

${behaviorDesc}

关系状态：
- 关系阶段: ${relationshipContext.relationshipStage}
- 互动状态: ${relationshipContext.interactionStatus}

请分析双方画像的匹配度，并预测关系趋势：
1. 关系趋势 (improving/stable/declining)
2. 基于双方画像的匹配分析（2-3条洞察）
3. 针对性的建议（结合双方特点，2-3条）

返回JSON格式：
{
  "trend": "improving/stable/declining",
  "confidence": 0-100,
  "insights": ["洞察1", "洞察2"],
  "recommendations": ["建议1", "建议2"]
}`
  }

  /**
   * 构建用户画像描述
   */
  private buildUserDescription(userPortrait: UserPortraitSummary | null): string {
    if (!userPortrait) return ''

    const traits = userPortrait.personality?.traits?.join('、') || '未知'
    
    return `用户（你）的画像：
- 性格特点: ${traits}
- 外向性: ${userPortrait.personality?.extraversion || 50}
- 宜人性: ${userPortrait.personality?.agreeableness || 50}
- 沟通风格: ${userPortrait.behavior?.communicationStyle || '未知'}
- 恋爱目标: ${userPortrait.relationship?.goal || '未知'}
- 依恋类型: ${userPortrait.relationship?.attachmentStyle || '未知'}`
  }

  /**
   * 构建目标画像描述
   */
  private buildTargetDescription(
    dimensions: Partial<PortraitDimensions>,
    behavior: BehaviorPattern | null
  ): string {
    const lines: string[] = []

    if (dimensions.personality) {
      lines.push(`- 外向性: ${dimensions.personality.extraversion}`)
      lines.push(`- 宜人性: ${dimensions.personality.agreeableness}`)
    }

    if (dimensions.emotional) {
      lines.push(`- 情绪稳定性: ${dimensions.emotional.stability}`)
      lines.push(`- 共情能力: ${dimensions.emotional.empathy}`)
    }

    if (dimensions.social) {
      lines.push(`- 社交主动性: ${dimensions.social.initiative}`)
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
    if (!behavior || !dataSourceInfo.hasChatRecords) return ''

    return `聊天记录分析：
- 平均回复时间: ${behavior.avgResponseTime || '未知'}分钟
- 消息总数: ${behavior.totalInteractions || 0}
- 表情使用率: ${behavior.emojiUsageRate || 0}%`
  }

  /**
   * 数据不足时的默认结果
   */
  private getInsufficientDataResult(): TrendPredictionResult {
    return {
      trend: 'stable' as RelationshipTrend,
      confidence: 0,
      insights: ['尚未上传聊天记录或填写行为数据'],
      recommendations: [
        '上传聊天截图可以获得更准确的分析',
        '或手动填写对方的行为特点',
      ],
    }
  }

  /**
   * 降级结果
   */
  private getFallbackResult(
    dimensions: Partial<PortraitDimensions>,
    dataSource: string
  ): TrendPredictionResult {
    const confidence = dataSource === 'chat_record' ? 50 : 30
    
    const insights: string[] = ['保持当前的互动频率']
    const recommendations: string[] = ['多关注对方的情绪变化']

    // 基于画像维度给出简单建议
    if (dimensions.emotional?.stability !== undefined && dimensions.emotional.stability < 50) {
      recommendations.push('对方情绪较敏感，建议多给予关心和支持')
    }

    if (dimensions.personality?.extraversion !== undefined && dimensions.personality.extraversion < 40) {
      insights.push('对方偏内向，更喜欢深度交流')
      recommendations.push('选择安静的环境进行深入交流')
    }

    return {
      trend: 'stable' as RelationshipTrend,
      confidence,
      insights,
      recommendations,
    }
  }
}
