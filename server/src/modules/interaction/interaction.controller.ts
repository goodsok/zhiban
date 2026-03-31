import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common'
import { Request } from 'express'
import { InteractionService, CreateInteractionDto, UpdateInteractionDto, InteractionType } from './interaction.service'
import { RelationshipEnergyService } from './relationship-energy.service'

@Controller('interaction')
export class InteractionController {
  constructor(
    private readonly interactionService: InteractionService,
    private readonly energyService: RelationshipEnergyService,
  ) {}

  // ==================== 互动类型配置 ====================

  /**
   * 获取互动类型配置
   * GET /api/interaction/types
   */
  @Get('types')
  getInteractionTypes() {
    return this.interactionService.getInteractionTypes()
  }

  // ==================== 互动事件 CRUD ====================

  /**
   * 获取互动事件列表
   * GET /api/interaction/match/:matchId
   */
  @Get('match/:matchId')
  async getEventsByMatchId(
    @Param('matchId') matchId: string,
    @Query('type') type?: InteractionType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.interactionService.getEventsByMatchId(parseInt(matchId), {
      interactionType: type,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
  }

  /**
   * 获取互动事件详情
   * GET /api/interaction/:id
   */
  @Get(':id')
  async getEventById(@Param('id') id: string) {
    return this.interactionService.getEventById(parseInt(id))
  }

  /**
   * 创建互动事件
   * POST /api/interaction/match/:matchId
   */
  @Post('match/:matchId')
  async createEvent(
    @Param('matchId') matchId: string,
    @Body() body: CreateInteractionDto,
    @Req() req: Request,
  ) {
    return this.interactionService.createEvent(parseInt(matchId), body, req)
  }

  /**
   * 更新互动事件
   * PUT /api/interaction/:id
   */
  @Put(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() body: UpdateInteractionDto,
    @Req() req: Request,
  ) {
    // 先获取事件以获取 matchId
    const existingEvent = await this.interactionService.getEventById(parseInt(id))
    if (existingEvent.code !== 200 || !existingEvent.data) {
      return existingEvent
    }

    const result = await this.interactionService.updateEvent(parseInt(id), body, req)
    
    // 更新成功后重新计算关系能量
    if (result.code === 200 && result.data) {
      await this.energyService.calculateAndUpdateEnergy(
        existingEvent.data.matchId,
        'interaction',
        `更新互动: ${result.data.interactionType}`,
        result.data.id
      )
    }
    
    return result
  }

  /**
   * 删除互动事件
   * DELETE /api/interaction/:id
   */
  @Delete(':id')
  async deleteEvent(@Param('id') id: string) {
    // 先获取事件以获取 matchId
    const existingEvent = await this.interactionService.getEventById(parseInt(id))
    if (existingEvent.code !== 200 || !existingEvent.data) {
      return existingEvent
    }

    const matchId = existingEvent.data.matchId
    const result = await this.interactionService.deleteEvent(parseInt(id))
    
    // 删除成功后重新计算关系能量
    if (result.code === 200) {
      await this.energyService.calculateAndUpdateEnergy(
        matchId,
        'interaction',
        '删除互动记录'
      )
    }
    
    return result
  }

  // ==================== 互动统计 ====================

  /**
   * 获取互动统计
   * GET /api/interaction/match/:matchId/stats
   */
  @Get('match/:matchId/stats')
  async getInteractionStats(@Param('matchId') matchId: string) {
    return this.interactionService.getInteractionStats(parseInt(matchId))
  }

  // ==================== 关系能量 ====================

  /**
   * 获取关系能量
   * GET /api/interaction/match/:matchId/energy
   */
  @Get('match/:matchId/energy')
  async getEnergy(@Param('matchId') matchId: string) {
    return this.energyService.getEnergy(parseInt(matchId))
  }

  /**
   * 获取能量历史
   * GET /api/interaction/match/:matchId/energy/history
   */
  @Get('match/:matchId/energy/history')
  async getEnergyHistory(
    @Param('matchId') matchId: string,
    @Query('limit') limit?: string,
  ) {
    return this.energyService.getEnergyHistory(
      parseInt(matchId),
      limit ? parseInt(limit) : 30
    )
  }

  /**
   * 手动触发能量计算
   * POST /api/interaction/match/:matchId/energy/calculate
   */
  @Post('match/:matchId/energy/calculate')
  async calculateEnergy(@Param('matchId') matchId: string) {
    return this.energyService.calculateAndUpdateEnergy(
      parseInt(matchId),
      'manual',
      '手动触发计算'
    )
  }

  /**
   * 获取当前时机效果和建议
   * GET /api/interaction/match/:matchId/energy/timing
   */
  @Get('match/:matchId/energy/timing')
  async getTimingEffects(@Param('matchId') matchId: string) {
    return this.energyService.getActiveTimingEffects(parseInt(matchId))
  }

  /**
   * 计算互动预期能量贡献（创建前预览）
   * POST /api/interaction/match/:matchId/energy/preview
   */
  @Post('match/:matchId/energy/preview')
  async previewEnergy(
    @Param('matchId') matchId: string,
    @Body() body: { interactionType: string; mood: string; breakthrough?: boolean; duration?: number },
  ) {
    return this.energyService.calculateInteractionEnergy(
      parseInt(matchId),
      body.interactionType,
      body.mood,
      body.breakthrough || false,
      body.duration
    )
  }
}
