import { Module } from '@nestjs/common'
import { MatchController } from './match.controller'
import { MatchService } from './match.service'
import { TaskModule } from '../task/task.module'
import { InteractionModule } from '../interaction/interaction.module'

@Module({
  imports: [TaskModule, InteractionModule],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
