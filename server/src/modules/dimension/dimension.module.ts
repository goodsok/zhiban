import { Module } from '@nestjs/common'
import { DimensionController } from './dimension.controller'
import { DimensionService } from './dimension.service'

@Module({
  controllers: [DimensionController],
  providers: [DimensionService],
  exports: [DimensionService]
})
export class DimensionModule {}
