import { Controller, Get, Param, Req, Post, Query } from '@nestjs/common'
import { Request } from 'express'
import { PortraitService } from './portrait.service'

@Controller('portrait')
export class PortraitController {
  constructor(private readonly portraitService: PortraitService) {}

  /**
   * 获取画像详情
   */
  @Get(':matchId')
  async getPortrait(@Param('matchId') matchId: string) {
    const id = parseInt(matchId, 10)
    if (isNaN(id)) {
      return { code: 400, data: null, message: '无效的ID' }
    }

    try {
      const portrait = await this.portraitService.getOrCreatePortrait(id)
      return { code: 200, data: portrait, message: 'success' }
    } catch (error) {
      console.error('Get portrait error:', error)
      return { code: 500, data: null, message: '获取画像失败' }
    }
  }

  /**
   * 获取画像变化趋势
   */
  @Get(':matchId/trends')
  async getTrends(@Param('matchId') matchId: string) {
    const id = parseInt(matchId, 10)
    if (isNaN(id)) {
      return { code: 400, data: null, message: '无效的ID' }
    }

    try {
      const trends = await this.portraitService.getPortraitTrends(id)
      return { code: 200, data: trends, message: 'success' }
    } catch (error) {
      console.error('Get trends error:', error)
      return { code: 500, data: null, message: '获取趋势失败' }
    }
  }

  /**
   * 预测关系走向
   */
  @Get(':matchId/prediction')
  async getPrediction(@Param('matchId') matchId: string, @Req() req: Request) {
    const id = parseInt(matchId, 10)
    if (isNaN(id)) {
      return { code: 400, data: null, message: '无效的ID' }
    }

    try {
      const prediction = await this.portraitService.predictRelationshipTrend(id, req)
      return { code: 200, data: prediction, message: 'success' }
    } catch (error) {
      console.error('Get prediction error:', error)
      return { code: 500, data: null, message: '预测失败' }
    }
  }

  /**
   * 获取互动策略推荐
   */
  @Get(':matchId/strategies')
  async getStrategies(@Param('matchId') matchId: string, @Req() req: Request) {
    const id = parseInt(matchId, 10)
    if (isNaN(id)) {
      return { code: 400, data: null, message: '无效的ID' }
    }

    try {
      const strategies = await this.portraitService.getInteractionStrategy(id, req)
      return { code: 200, data: strategies, message: 'success' }
    } catch (error) {
      console.error('Get strategies error:', error)
      return { code: 500, data: null, message: '获取策略失败' }
    }
  }

  /**
   * 重新分析画像
   * 基于档案维度数据重新计算画像维度
   */
  @Post(':matchId/analyze')
  async analyzePortrait(@Param('matchId') matchId: string, @Req() req: Request) {
    const id = parseInt(matchId, 10)
    if (isNaN(id)) {
      return { code: 400, data: null, message: '无效的ID' }
    }

    try {
      const portrait = await this.portraitService.reanalyzePortrait(id, req)
      return { code: 200, data: portrait, message: '分析完成' }
    } catch (error) {
      console.error('Analyze portrait error:', error)
      return { code: 500, data: null, message: '分析失败' }
    }
  }

  /**
   * 获取深度洞察
   * 聚合所有数据，使用 AI 进行深度分析
   * 如果已有缓存结果，默认直接返回；forceRefresh=true 时重新生成
   */
  @Get(':matchId/insight')
  async getInsight(
    @Param('matchId') matchId: string,
    @Query('forceRefresh') forceRefresh: string,
    @Req() req: Request
  ) {
    const id = parseInt(matchId, 10)
    if (isNaN(id)) {
      return { code: 400, data: null, message: '无效的ID' }
    }

    try {
      const shouldForce = forceRefresh === 'true' || forceRefresh === '1'
      const insight = await this.portraitService.generateInsight(id, req, shouldForce)
      return { code: 200, data: insight, message: 'success' }
    } catch (error) {
      console.error('Generate insight error:', error)
      return { code: 500, data: null, message: '洞察生成失败' }
    }
  }
}
