import { Module } from '@nestjs/common'
import { MatchController } from './match.controller'
import { MatchService } from './match.service'
import { TaskModule } from '../task/task.module'

@Module({
  imports: [TaskModule],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
