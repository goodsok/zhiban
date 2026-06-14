import { Module, forwardRef } from '@nestjs/common';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';
import { MatchModule } from '../match/match.module';

@Module({
  imports: [forwardRef(() => MatchModule)],
  controllers: [TopicController],
  providers: [TopicService],
  exports: [TopicService],
})
export class TopicModule {}
