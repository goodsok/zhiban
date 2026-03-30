import { Module } from '@nestjs/common'
import { PortraitController } from './portrait.controller'
import { PortraitService } from './portrait.service'

@Module({
  controllers: [PortraitController],
  providers: [PortraitService],
  exports: [PortraitService],
})
export class PortraitModule {}
