import { Controller, Get, Post, Body } from '@nestjs/common';
import { QuizService } from './quiz.service';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get('questions')
  getQuestions() {
    return this.quizService.getQuestions();
  }

  @Post('submit')
  submitAnswer(@Body() body: { questionId: number; answer: number }) {
    return this.quizService.submitAnswer(body.questionId, body.answer);
  }

  @Get('result')
  getResult() {
    return this.quizService.getResult();
  }
}
