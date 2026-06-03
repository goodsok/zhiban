/**
 * 人物画像服务（API层）
 * 
 * 负责处理HTTP请求，委托给画像引擎执行具体逻辑
 * 保持向后兼容的接口
 */

import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { UserProfileService } from '@/modules/user-profile/user-profile.service'
import { PortraitEngineService } from '@/modules/portrait-engine/portrait-engine.service'
import {
  FullPortrait,
  BehaviorPattern,
  PortraitHistoryRecord,
  ChatRecordAnalysisResult,
  TrendPredictionResult,
  StrategyRecommendationResult,
  UserPortraitSummary,
} from '@/modules/portrait-engine/types/portrait.types'
import { InsightAnalysisResult } from '@/modules/portrait-engine/analyzers/insight.analyzer'

// 导出类型供外部使用
export type {
  FullPortrait,
  BehaviorPattern,
  PortraitHistoryRecord,
  ChatRecordAnalysisResult,
  TrendPredictionResult,
  StrategyRecommendationResult,
}

@Injectable()
export class PortraitService {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly portraitEngine: PortraitEngineService,
  ) {}

  /**
   * 获取或创建画像
   */
  async getOrCreatePortrait(matchId: number): Promise<FullPortrait> {
    return this.portraitEngine.getOrCreatePortrait(matchId)
  }

  /**
   * 上传并分析聊天记录截图
   */
  async uploadAndAnalyzeChatRecord(
    matchId: number,
    base64Data: string,
    req: Request
  ): Promise<{ success: boolean; analysis?: ChatRecordAnalysisResult; message: string }> {
    return this.portraitEngine.uploadAndAnalyzeChatRecord(matchId, base64Data, req)
  }

  /**
   * 保存手动填写的行为数据
   */
  async saveManualBehaviorData(
    matchId: number,
    data: {
      responseSpeed?: 'instant' | 'fast' | 'normal' | 'slow' | 'very_slow'
      activeTimeSlots?: string[]
      topicPreferences?: string[]
      communicationStyle?: 'direct' | 'indirect' | 'balanced'
      notes?: string
    }
  ): Promise<{ success: boolean; message: string }> {
    return this.portraitEngine.saveManualBehaviorData(matchId, data)
  }

  /**
   * 获取画像变化趋势
   */
  async getPortraitTrends(matchId: number): Promise<Record<string, Array<{ date: string; value: number }>>> {
    return this.portraitEngine.getPortraitTrends(matchId)
  }

  /**
   * 智能推理 - 预测关系走向
   */
  async predictRelationshipTrend(matchId: number, req: Request): Promise<TrendPredictionResult> {
    // 获取用户画像
    let userPortrait: UserPortraitSummary | null = null
    try {
      userPortrait = await this.userProfileService.getUserPortrait(1) as UserPortraitSummary
    } catch (e) {
      console.log('User portrait not found, using default')
    }

    return this.portraitEngine.predictRelationshipTrend(matchId, userPortrait, req)
  }

  /**
   * 获取互动策略推荐
   */
  async getInteractionStrategy(matchId: number, req: Request): Promise<StrategyRecommendationResult> {
    // 获取用户画像
    let userPortrait: UserPortraitSummary | null = null
    try {
      userPortrait = await this.userProfileService.getUserPortrait(1) as UserPortraitSummary
    } catch (e) {
      console.log('User portrait not found, using default')
    }

    return this.portraitEngine.getInteractionStrategy(matchId, userPortrait, req)
  }

  /**
   * 重新分析画像
   * 基于已有的聊天记录和手动数据重新计算画像维度
   */
  async reanalyzePortrait(matchId: number, req: Request): Promise<FullPortrait> {
    return this.portraitEngine.reanalyzePortrait(matchId, req)
  }

  /**
   * 生成深度洞察分析
   * 聚合该对象的全部数据，使用 LLM 进行深度洞察
   */
  async generateInsight(matchId: number, req: Request, forceRefresh = false): Promise<InsightAnalysisResult> {
    return this.portraitEngine.generateInsight(matchId, req, forceRefresh)
  }
}
