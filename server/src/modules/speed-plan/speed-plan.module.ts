import { Module } from '@nestjs/common'
import { SpeedPlanController } from './speed-plan.controller'
import { SpeedPlanService } from './speed-plan.service'

@Module({
  controllers: [SpeedPlanController],
  providers: [SpeedPlanService],
})
export class SpeedPlanModule {}
