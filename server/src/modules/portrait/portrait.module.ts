import { Module } from '@nestjs/common'
import { PortraitController } from './portrait.controller'
import { PortraitService } from './portrait.service'
import { UserProfileModule } from '@/modules/user-profile/user-profile.module'
import { PortraitEngineModule } from '@/modules/portrait-engine/portrait-engine.module'

@Module({
  imports: [
    UserProfileModule,
    PortraitEngineModule,
  ],
  controllers: [PortraitController],
  providers: [PortraitService],
  exports: [PortraitService],
})
export class PortraitModule {}
