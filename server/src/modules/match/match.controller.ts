import { Controller, Get, Post, Body, Param, Req, Put } from '@nestjs/common'
import { Request } from 'express'
import { MatchService } from './match.service'

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get('list')
  async getMatchList(@Req() req: Request) {
    return await this.matchService.getMatches(req, {})
  }

  @Get(':id')
  async getMatchDetail(@Param('id') id: string, @Req() req: Request) {
    return await this.matchService.getMatchById(req, Number(id))
  }

  @Post('create')
  async createMatch(@Body() body: {
    name: string
    gender?: string
    meetingScene?: string
    meetingDate?: string
    impression?: number
    impressionTags?: string[]
    notes?: string
  }, @Req() req: Request) {
    return await this.matchService.createMatch(req, body)
  }

  @Put(':id')
  @Post(':id/update')
  async updateMatch(@Param('id') id: string, @Body() body: Partial<{
    name: string
    gender: string
    meetingScene: string
    meetingDate: string
    impression: number
    impressionTags: string[]
    keyInfo: Array<{ id: string; type: string; label: string; icon: string; value: string }>
    notes: string
    status: string
    nextAction: string
  }>, @Req() req: Request) {
    return await this.matchService.updateMatch(req, Number(id), body)
  }

  @Post(':id/delete')
  async deleteMatch(@Param('id') id: string, @Req() req: Request) {
    return await this.matchService.deleteMatch(req, Number(id))
  }

  @Get(':id/recommend')
  async getRecommendations(@Param('id') id: string, @Req() req: Request) {
    return await this.matchService.getRecommendations(req, Number(id))
  }

  // ============== 周期追踪接口 ==============

  @Get(':id/cycle')
  async getCycleInfo(@Param('id') id: string, @Req() req: Request) {
    return await this.matchService.getCycleInfo(req, Number(id))
  }

  @Post(':id/cycle')
  async updateCycleInfo(@Param('id') id: string, @Body() body: { cycleStartDate: string; cycleLength?: number }, @Req() req: Request) {
    return await this.matchService.updateCycle(req, Number(id), body)
  }

  // ============== 推进值接口 ==============

  @Get(':id/progress-score')
  async getProgressScore(@Param('id') id: string, @Req() req: Request) {
    return await this.matchService.getProgressValue(req, Number(id))
  }
}
