import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { MatchModule } from '@/modules/match/match.module';
import { CoupleModule } from '@/modules/couple/couple.module';
import { TopicModule } from '@/modules/topic/topic.module';
import { TaskModule } from '@/modules/task/task.module';
import { QuizModule } from '@/modules/quiz/quiz.module';
import { DateRecordModule } from '@/modules/date-record/date-record.module';
import { KnowledgeModule } from '@/modules/knowledge/knowledge.module';

@Module({
  imports: [MatchModule, CoupleModule, TopicModule, TaskModule, QuizModule, DateRecordModule, KnowledgeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
