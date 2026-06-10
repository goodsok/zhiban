import { Module } from '@nestjs/common'
import { TwinController } from './twin.controller'
import { TwinService } from './twin.service'
import { PortraitEngineModule } from '../portrait-engine/portrait-engine.module'

@Module({
  imports: [PortraitEngineModule],
  controllers: [TwinController],
  providers: [TwinService],
})
export class TwinModule {}
