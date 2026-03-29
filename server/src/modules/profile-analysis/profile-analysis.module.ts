import { Module } from '@nestjs/common'
import { ProfileAnalysisController } from './profile-analysis.controller'
import { ProfileAnalysisService } from './profile-analysis.service'

@Module({
  controllers: [ProfileAnalysisController],
  providers: [ProfileAnalysisService],
})
export class ProfileAnalysisModule {}
