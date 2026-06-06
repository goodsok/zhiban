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
import { SpeedPlanModule } from '@/modules/speed-plan/speed-plan.module';
import { StoryModule } from '@/modules/story/story.module';
import { MomentsModule } from '@/modules/moments/moments.module';
import { DatingModule } from '@/modules/dating/dating.module';
import { GrowModule } from '@/modules/grow/grow.module';
import { ChatReviewModule } from '@/modules/chat-review/chat-review.module';
import { DatePlanModule } from '@/modules/date-plan/date-plan.module';
import { SweetTalkModule } from '@/modules/sweet-talk/sweet-talk.module';
import { GameDataModule } from '@/modules/game-data/game-data.module';
import { TwinModule } from '@/modules/twin/twin.module';

@Module({
  imports: [MatchModule, CoupleModule, TopicModule, TaskModule, QuizModule, DateRecordModule, KnowledgeModule, ChatModule, ProfileAnalysisModule, PortraitModule, UserProfileModule, DimensionModule, InteractionModule, SpeedPlanModule, StoryModule, MomentsModule, DatingModule, GrowModule, ChatReviewModule, DatePlanModule, SweetTalkModule, GameDataModule, TwinModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
