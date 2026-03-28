import { Controller, Get, Post } from '@nestjs/common';
import { TopicService } from './topic.service';

@Controller('topic')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Get('icebreaker')
  async getIcebreakerTopics() {
    return this.topicService.getIcebreakerTopics();
  }

  @Post('generate')
  async generateTopic() {
    return this.topicService.generateTopic();
  }
}
