import { Controller, Post, Get, Delete, Body, Param, Query, Req, HttpCode } from '@nestjs/common'
import { Request } from 'express'
import { DatePlanService } from './date-plan.service'

@Controller('date-plan')
export class DatePlanController {
  constructor(private readonly datePlanService: DatePlanService) {}

  /**
   * 生成约会计划
   * POST /api/date-plan/generate
   */
  @Post('generate')
  @HttpCode(200)
  async generatePlan(
    @Body() body: {
      matchId: number
      budget?: string
      season?: string
      location?: string
      preference?: string
      duration?: string
    },
    @Req() req: Request,
  ) {
    return this.datePlanService.generatePlan(body, req)
  }

  /**
   * 获取约会计划列表
   * GET /api/date-plan/list?matchId=1
   */
  @Get('list')
  async getPlans(@Query('matchId') matchId?: string) {
    return this.datePlanService.getPlans(matchId ? parseInt(matchId) : undefined)
  }

  /**
   * 获取约会计划详情
   * GET /api/date-plan/:id
   */
  @Get(':id')
  async getPlanById(@Param('id') id: string) {
    return this.datePlanService.getPlanById(parseInt(id))
  }

  /**
   * 删除约会计划
   * DELETE /api/date-plan/:id
   */
  @Delete(':id')
  async deletePlan(@Param('id') id: string) {
    return this.datePlanService.deletePlan(parseInt(id))
  }

  /**
   * 获取对象列表
   * GET /api/date-plan/matches
   */
  @Get('matches/list')
  async getMatchList() {
    return this.datePlanService.getMatchList()
  }
}
