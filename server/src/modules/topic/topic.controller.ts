import { Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { TopicService } from './topic.service';

@Controller('topic')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Get('icebreaker')
  async getIcebreakerTopics(@Query('matchId') matchId?: string, @Req() req?: Request) {
    if (matchId) {
      return this.topicService.getPersonalizedIcebreakerTopics(req!, Number(matchId));
    }
    return this.topicService.getIcebreakerTopics();
  }

  @Post('generate')
  async generateTopic() {
    return this.topicService.generateTopic();
  }
}
