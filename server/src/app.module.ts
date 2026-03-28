import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { MatchModule } from '@/modules/match/match.module';
import { CoupleModule } from '@/modules/couple/couple.module';
import { TopicModule } from '@/modules/topic/topic.module';
import { TaskModule } from '@/modules/task/task.module';
import { QuizModule } from '@/modules/quiz/quiz.module';

@Module({
  imports: [MatchModule, CoupleModule, TopicModule, TaskModule, QuizModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
