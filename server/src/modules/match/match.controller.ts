import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common'
import { Request } from 'express'
import { MatchService } from './match.service'

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
    age: number
    gender: string
    occupation: string
    mbti: string
    zodiac: string
    meetingScene: string
    meetingDate: string
    impression: number
    impressionTags: string[]
    interests: string[]
    notes: string
  }) {
    return this.matchService.createMatch(body)
  }

  @Post(':id/update')
  updateMatch(@Param('id') id: string, @Body() body: Partial<{
    name: string
    age: number
    gender: string
    occupation: string
    mbti: string
    zodiac: string
    meetingScene: string
    meetingDate: string
    relationshipStage: string
    interactionStatus: string
    impression: number
    impressionTags: string[]
    interests: string[]
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
}
