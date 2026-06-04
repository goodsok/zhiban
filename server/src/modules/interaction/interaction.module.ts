import { Module } from '@nestjs/common'
import { InteractionController } from './interaction.controller'
import { InteractionService } from './interaction.service'
import { RelationshipEnergyService } from './relationship-energy.service'
import { ChatRecordService } from './chat-record.service'
import { ChatRecordController } from './chat-record.controller'

@Module({
  controllers: [InteractionController, ChatRecordController],
  providers: [InteractionService, RelationshipEnergyService, ChatRecordService],
  exports: [InteractionService, RelationshipEnergyService, ChatRecordService],
})
export class InteractionModule {}
