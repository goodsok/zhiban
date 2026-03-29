import { Module, forwardRef } from '@nestjs/common'
import { DateRecordController } from './date-record.controller'
import { DateRecordService } from './date-record.service'
import { MatchModule } from '../match/match.module'

@Module({
  imports: [forwardRef(() => MatchModule)],
  controllers: [DateRecordController],
  providers: [DateRecordService],
  exports: [DateRecordService],
})
export class DateRecordModule {}
