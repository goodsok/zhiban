/**
 * 人物画像服务（API层）
 * 
 * 负责处理HTTP请求，委托给画像引擎执行具体逻辑
 * 画像数据全部从档案维度系统读取，不再提供手动填写和截图上传
 */

import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { UserProfileService } from '@/modules/user-profile/user-profile.service'
import { PortraitEngineService } from '@/modules/portrait-engine/portrait-engine.service'
import {
  FullPortrait,
  PortraitHistoryRecord,
  TrendPredictionResult,
  StrategyRecommendationResult,
  UserPortraitSummary,
} from '@/modules/portrait-engine/types/portrait.types'
import { InsightAnalysisResult } from '@/modules/portrait-engine/analyzers/insight.analyzer'

// 导出类型供外部使用
export type {
  FullPortrait,
  PortraitHistoryRecord,
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
   * 基于档案维度数据重新计算画像维度
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

  /**
   * 生成相处模式画像
   * 从维度数据合成为可读的行为侧写
   */
  async generateInteractionProfile(matchId: number, req: Request, forceRefresh = false) {
    return this.portraitEngine.generateInteractionProfile(matchId, req, forceRefresh)
  }
}
