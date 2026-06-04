import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common'
import { GrowService } from './grow.service'

@Controller('grow')
export class GrowController {
  constructor(private readonly growService: GrowService) {}

  /**
   * 获取全部成长数据
   */
  @Get()
  async getGrowData(@Query('matchId') matchId: number) {
    return this.growService.getGrowData(Number(matchId))
  }

  // ===== 纪念日 =====
  @Post('anniversary')
  async addAnniversary(
    @Body() body: { matchId: number; title: string; date: string; icon?: string }
  ) {
    return this.growService.addAnniversary(
      body.matchId,
      body.title,
      body.date,
      body.icon || '💝'
    )
  }

  @Delete('anniversary/:id')
  async deleteAnniversary(@Param('id') id: number) {
    return this.growService.deleteAnniversary(Number(id))
  }

  // ===== 目标 =====
  @Post('goal')
  async addGoal(
    @Body() body: { matchId: number; title: string; total: number }
  ) {
    return this.growService.addGoal(body.matchId, body.title, body.total)
  }

  @Post('goal/:id/progress')
  async updateGoalProgress(
    @Param('id') id: number,
    @Body() body: { delta: number }
  ) {
    return this.growService.updateGoalProgress(Number(id), body.delta)
  }

  @Delete('goal/:id')
  async deleteGoal(@Param('id') id: number) {
    return this.growService.deleteGoal(Number(id))
  }

  // ===== 日记 =====
  @Post('memory')
  async addMemory(
    @Body() body: { matchId: number; content: string; date?: string }
  ) {
    return this.growService.addMemory(
      body.matchId,
      body.content,
      body.date || new Date().toISOString().split('T')[0]
    )
  }

  @Delete('memory/:id')
  async deleteMemory(@Param('id') id: number) {
    return this.growService.deleteMemory(Number(id))
  }

  // ===== 约定 =====
  @Post('promise')
  async addPromise(
    @Body() body: { matchId: number; content: string }
  ) {
    return this.growService.addPromise(body.matchId, body.content)
  }

  @Post('promise/:id/toggle')
  async togglePromise(@Param('id') id: number) {
    return this.growService.togglePromise(Number(id))
  }

  @Delete('promise/:id')
  async deletePromise(@Param('id') id: number) {
    return this.growService.deletePromise(Number(id))
  }
}
