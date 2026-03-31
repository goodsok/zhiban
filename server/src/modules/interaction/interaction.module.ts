import { Module } from '@nestjs/common'
import { InteractionController } from './interaction.controller'
import { InteractionService } from './interaction.service'
import { RelationshipEnergyService } from './relationship-energy.service'

@Module({
  controllers: [InteractionController],
  providers: [InteractionService, RelationshipEnergyService],
  exports: [InteractionService, RelationshipEnergyService],
})
export class InteractionModule {}
