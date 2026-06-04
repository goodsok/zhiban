import { Module } from '@nestjs/common'
import { SweetTalkController } from './sweet-talk.controller'
import { SweetTalkService } from './sweet-talk.service'

@Module({
  controllers: [SweetTalkController],
  providers: [SweetTalkService],
  exports: [SweetTalkService],
})
export class SweetTalkModule {}
