import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common'
import { Request } from 'express'
import { DateRecordService } from './date-record.service'

@Controller('date-record')
export class DateRecordController {
  constructor(private readonly dateRecordService: DateRecordService) {}

  @Get('list')
  getRecords(@Query('matchId') matchId: string) {
    return this.dateRecordService.getRecordsByMatchId(Number(matchId))
  }

  @Get('stats')
  getStats(@Query('matchId') matchId: string) {
    return this.dateRecordService.getDateStats(Number(matchId))
  }

  @Get(':id')
  getRecord(@Param('id') id: string) {
    return this.dateRecordService.getRecordById(Number(id))
  }

  @Post('create')
  async createRecord(
    @Body() body: {
      matchId: number
      date: string
      location: string
      activity: string
      duration: string
      mood: 'excellent' | 'good' | 'normal' | 'not_good'
      highlights?: string[]
      notes?: string
      photos?: string[]
    },
    @Req() req: Request
  ) {
    return this.dateRecordService.createRecord(
      body.matchId,
      {
        date: body.date,
        location: body.location,
        activity: body.activity,
        duration: body.duration,
        mood: body.mood,
        highlights: body.highlights,
        notes: body.notes,
        photos: body.photos,
      },
      req
    )
  }

  @Post('update/:id')
  async updateRecord(
    @Param('id') id: string,
    @Body() body: Partial<{
      date: string
      location: string
      activity: string
      duration: string
      mood: 'excellent' | 'good' | 'normal' | 'not_good'
      highlights: string[]
      notes: string
      photos: string[]
    }>,
    @Req() req: Request
  ) {
    return this.dateRecordService.updateRecord(Number(id), body, req)
  }

  @Post('delete/:id')
  deleteRecord(@Param('id') id: string) {
    return this.dateRecordService.deleteRecord(Number(id))
  }

  @Post('extract/:id')
  async extractKeyInfo(@Param('id') id: string, @Req() req: Request) {
    return this.dateRecordService.extractKeyInfoManually(Number(id), req)
  }
}
