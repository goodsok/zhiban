import { Controller, Get, Post, Body, Param, Req, Put } from '@nestjs/common'
import { Request } from 'express'
import { MatchService, HardwareInfo, SoftwareInfo } from './match.service'

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get('list')
  getMatchList() {
    return this.matchService.getMatchList()
  }

  @Get(':id')
  getMatchDetail(@Param('id') id: string) {
    return this.matchService.getMatchDetail(Number(id))
  }

  @Post('create')
  createMatch(@Body() body: {
    name: string
    gender?: string
    hardware?: Partial<HardwareInfo>
    software?: Partial<SoftwareInfo>
    meetingScene?: string
    meetingDate?: string
    relationshipStage?: string
    interactionStatus?: string
    impression?: number
    impressionTags?: string[]
    notes?: string
  }) {
    return this.matchService.createMatch(body)
  }

  @Put(':id')
  @Post(':id/update')
  updateMatch(@Param('id') id: string, @Body() body: Partial<{
    name: string
    gender: string
    hardware: Partial<HardwareInfo>
    software: Partial<SoftwareInfo>
    meetingScene: string
    meetingDate: string
    relationshipStage: string
    interactionStatus: string
    impression: number
    impressionTags: string[]
    keyInfo: Array<{ id: string; type: string; label: string; icon: string; value: string }>
    notes: string
    status: string
    nextAction: string
  }>) {
    return this.matchService.updateMatch(Number(id), body)
  }

  @Post(':id/delete')
  deleteMatch(@Param('id') id: string) {
    return this.matchService.deleteMatch(Number(id))
  }

  @Get(':id/recommend')
  getRecommendations(@Param('id') id: string) {
    return this.matchService.getRecommendations(Number(id))
  }

  @Post(':id/ai-topics')
  async getAITopics(@Param('id') id: string, @Req() req: Request) {
    return this.matchService.getAITopics(Number(id), req)
  }

  @Post(':id/ai-interaction')
  async getAIInteraction(@Param('id') id: string, @Body() body: { situation?: string }, @Req() req: Request) {
    return this.matchService.getAIInteraction(Number(id), body.situation, req)
  }

  // ============== 周期追踪接口 ==============

  @Get(':id/cycle')
  getCycleInfo(@Param('id') id: string) {
    return this.matchService.getCycleInfo(Number(id))
  }

  @Post(':id/cycle')
  updateCycleInfo(@Param('id') id: string, @Body() body: { cycleStartDate: string; cycleLength?: number }) {
    return this.matchService.updateCycleInfo(Number(id), body.cycleStartDate, body.cycleLength)
  }
}
