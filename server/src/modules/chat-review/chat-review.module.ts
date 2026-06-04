import { Module } from '@nestjs/common'
import { ChatReviewController } from './chat-review.controller'
import { ChatReviewService } from './chat-review.service'

@Module({
  controllers: [ChatReviewController],
  providers: [ChatReviewService],
  exports: [ChatReviewService],
})
export class ChatReviewModule {}
