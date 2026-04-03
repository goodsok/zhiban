import { Controller, Post, Get, Delete, Param, Body, Query, Req } from '@nestjs/common'
import { Request } from 'express'
import { SpeedPlanService } from './speed-plan.service'

@Controller('speed-plan')
export class SpeedPlanController {
  constructor(private readonly speedPlanService: SpeedPlanService) {}

  /**
   * 创建方案并生成初始内容
   */
  @Post('create')
  async createPlan(
    @Body() body: {
      background: string
      currentProgress: string[]
      matchId: number
      targetHours: number
      targetBehavior: string
    },
    @Req() req: Request
  ) {
    return this.speedPlanService.createPlan(body, req)
  }

  /**
   * 获取方案列表
   */
  @Get('list')
  async getPlanList(
    @Query('matchId') matchId?: number,
    @Req() req: Request = {} as Request
  ) {
    return this.speedPlanService.getPlanList(matchId, req)
  }

  /**
   * 获取方案详情（含聊天记录）
   */
  @Get(':id')
  async getPlanDetail(
    @Param('id') id: number,
    @Req() req: Request
  ) {
    return this.speedPlanService.getPlanDetail(Number(id), req)
  }

  /**
   * 继续对话
   */
  @Post(':id/chat')
  async continueChat(
    @Param('id') id: number,
    @Body() body: { message: string },
    @Req() req: Request
  ) {
    return this.speedPlanService.continueChat(Number(id), body.message, req)
  }

  /**
   * 删除方案
   */
  @Delete(':id')
  async deletePlan(
    @Param('id') id: number,
    @Req() req: Request
  ) {
    return this.speedPlanService.deletePlan(Number(id), req)
  }
}
