import { Injectable } from '@nestjs/common';

@Injectable()
export class QuizService {
  // 默契测试题目
  private questions = [
    {
      id: 1,
      question: '对方最喜欢的季节是？',
      options: ['春天 🌸', '夏天 ☀️', '秋天 🍂', '冬天 ❄️'],
      answer: 0,
    },
    {
      id: 2,
      question: '对方最喜欢的食物类型是？',
      options: ['中餐 🍜', '西餐 🍝', '日料 🍣', '韩餐 🍱'],
      answer: 2,
    },
    {
      id: 3,
      question: '对方更偏向哪种约会方式？',
      options: ['看电影 🎬', '逛街购物 🛍️', '户外郊游 🏕️', '宅家做饭 🍳'],
      answer: 3,
    },
    {
      id: 4,
      question: '对方喜欢的音乐类型是？',
      options: ['流行音乐 🎵', '古典音乐 🎼', '摇滚音乐 🎸', '民谣 🎤'],
      answer: 0,
    },
    {
      id: 5,
      question: '对方更喜欢的电影类型是？',
      options: ['爱情片 💕', '动作片 🎬', '喜剧片 😄', '科幻片 🚀'],
      answer: 2,
    },
  ];

  private score = 0;
  private answeredQuestions = new Set<number>();

  getQuestions() {
    return {
      code: 200,
      data: this.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      })),
      message: 'success',
    };
  }

  submitAnswer(questionId: number, answer: number) {
    const question = this.questions.find((q) => q.id === questionId);
    if (!question) {
      return {
        code: 404,
        data: null,
        message: 'Question not found',
      };
    }

    const isCorrect = question.answer === answer;
    if (isCorrect && !this.answeredQuestions.has(questionId)) {
      this.score++;
      this.answeredQuestions.add(questionId);
    }

    return {
      code: 200,
      data: {
        isCorrect,
        correctAnswer: question.answer,
      },
      message: 'success',
    };
  }

  getResult() {
    const total = this.questions.length;
    const percentage = Math.round((this.score / total) * 100);

    let message = '';
    let title = '';
    if (percentage === 100) {
      title = '心有灵犀！';
      message = '你们简直是灵魂伴侣 💕';
    } else if (percentage >= 60) {
      title = '默契十足！';
      message = '继续了解彼此吧 ✨';
    } else {
      title = '还需努力';
      message = '多聊聊，增进了解 🌟';
    }

    const result = {
      score: this.score,
      total,
      percentage,
      title,
      message,
    };

    // 重置分数供下次测试
    this.score = 0;
    this.answeredQuestions.clear();

    return {
      code: 200,
      data: result,
      message: 'success',
    };
  }
}
