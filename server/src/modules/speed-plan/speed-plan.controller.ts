import { Controller, Post, Body, Req } from '@nestjs/common'
import { Request } from 'express'
import { SpeedPlanService } from './speed-plan.service'

@Controller('speed-plan')
export class SpeedPlanController {
  constructor(private readonly speedPlanService: SpeedPlanService) {}

  @Post('generate')
  async generatePlan(
    @Body() body: {
      background: string
      currentProgress: string[]
      matchId: number
      targetHours: number
      targetBehavior: string
    },
    @Req() req: Request
  ) {
    return this.speedPlanService.generatePlan(body, req)
  }
}
