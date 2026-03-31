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
import { ChatModule } from '@/modules/chat/chat.module';
import { ProfileAnalysisModule } from '@/modules/profile-analysis/profile-analysis.module';
import { PortraitModule } from '@/modules/portrait/portrait.module';
import { UserProfileModule } from '@/modules/user-profile/user-profile.module';
import { DimensionModule } from '@/modules/dimension/dimension.module';
import { InteractionModule } from '@/modules/interaction/interaction.module';

@Module({
  imports: [MatchModule, CoupleModule, TopicModule, TaskModule, QuizModule, DateRecordModule, KnowledgeModule, ChatModule, ProfileAnalysisModule, PortraitModule, UserProfileModule, DimensionModule, InteractionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
