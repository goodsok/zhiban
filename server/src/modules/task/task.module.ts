import { Module, forwardRef } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { MatchModule } from '../match/match.module';

@Module({
  imports: [forwardRef(() => MatchModule)],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
