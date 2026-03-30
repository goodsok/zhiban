import { Controller, Get, Param, Req, Post } from '@nestjs/common'
import { Request } from 'express'
import { PortraitService } from './portrait.service'
import { getSupabaseClient } from '@/storage/database/supabase-client'

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
   * 触发画像分析
   */
  @Post(':matchId/analyze')
  async analyzePortrait(@Param('matchId') matchId: string, @Req() req: Request) {
    const id = parseInt(matchId, 10)
    if (isNaN(id)) {
      return { code: 400, data: null, message: '无效的ID' }
    }

    try {
      // 获取聊天历史
      const client = getSupabaseClient()
      const { data: chatHistory } = await client
        .from('chat_histories')
        .select('*')
        .eq('match_id', id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (!chatHistory || chatHistory.length < 3) {
        return { code: 400, data: null, message: '聊天记录不足，无法分析' }
      }

      await this.portraitService.analyzeAndUpdateFromChat(id, chatHistory as any, req)
      
      const portrait = await this.portraitService.getOrCreatePortrait(id)
      return { code: 200, data: portrait, message: 'success' }
    } catch (error) {
      console.error('Analyze portrait error:', error)
      return { code: 500, data: null, message: '分析失败' }
    }
  }
}
