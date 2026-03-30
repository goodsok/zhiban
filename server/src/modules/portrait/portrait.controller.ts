import { Controller, Get, Param, Req, Post, Body } from '@nestjs/common'
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
   * 上传聊天记录截图
   */
  @Post(':matchId/chat-record')
  async uploadChatRecord(
    @Param('matchId') matchId: string,
    @Body() body: { base64Data: string },
    @Req() req: Request
  ) {
    const id = parseInt(matchId, 10)
    if (isNaN(id)) {
      return { code: 400, data: null, message: '无效的ID' }
    }

    if (!body.base64Data) {
      return { code: 400, data: null, message: '请提供图片数据' }
    }

    try {
      const result = await this.portraitService.uploadAndAnalyzeChatRecord(id, body.base64Data, req)
      
      if (result.success) {
        return { code: 200, data: result.analysis, message: result.message }
      } else {
        return { code: 400, data: null, message: result.message }
      }
    } catch (error) {
      console.error('Upload chat record error:', error)
      return { code: 500, data: null, message: '上传失败' }
    }
  }

  /**
   * 保存手动填写的行为数据
   */
  @Post(':matchId/manual-data')
  async saveManualData(
    @Param('matchId') matchId: string,
    @Body() body: {
      responseSpeed?: 'instant' | 'fast' | 'normal' | 'slow' | 'very_slow'
      activeTimeSlots?: string[]
      topicPreferences?: string[]
      communicationStyle?: 'direct' | 'indirect' | 'balanced'
      notes?: string
    }
  ) {
    const id = parseInt(matchId, 10)
    if (isNaN(id)) {
      return { code: 400, data: null, message: '无效的ID' }
    }

    try {
      const result = await this.portraitService.saveManualBehaviorData(id, body)
      
      if (result.success) {
        return { code: 200, data: null, message: result.message }
      } else {
        return { code: 400, data: null, message: result.message }
      }
    } catch (error) {
      console.error('Save manual data error:', error)
      return { code: 500, data: null, message: '保存失败' }
    }
  }
}
