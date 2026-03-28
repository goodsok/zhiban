import { Injectable } from '@nestjs/common';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

@Injectable()
export class TopicService {
  private config = new Config();
  private client = new LLMClient(this.config);

  // 预设话题库
  private presetTopics = [
    { id: 1, topic: '你觉得什么样的约会最浪漫？', category: '浪漫话题' },
    { id: 2, topic: '你童年最快乐的记忆是什么？', category: '童年回忆' },
    { id: 3, topic: '你最想去哪里旅行？', category: '旅行梦想' },
    { id: 4, topic: '你最喜欢的电影是什么？为什么？', category: '兴趣爱好' },
    { id: 5, topic: '你觉得理想的周末应该怎么过？', category: '生活方式' },
    { id: 6, topic: '你最近学到的新技能是什么？', category: '成长话题' },
    { id: 7, topic: '你最喜欢的美食是什么？', category: '美食话题' },
    { id: 8, topic: '你觉得什么性格特质最重要？', category: '价值观' },
    { id: 9, topic: '你小时候的梦想是什么？', category: '童年回忆' },
    { id: 10, topic: '你最喜欢的一本书是什么？', category: '兴趣爱好' },
  ];

  async getIcebreakerTopics() {
    // 随机返回3个话题
    const shuffled = [...this.presetTopics].sort(() => Math.random() - 0.5);
    const topics = shuffled.slice(0, 3);

    return {
      code: 200,
      data: topics,
      message: 'success',
    };
  }

  async generateTopic() {
    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: '你是一个恋爱关系顾问，帮助情侣增进了解。请生成一个适合约会时聊的话题，要求温馨、有趣、能增进感情。只需要返回话题本身，不要其他解释。',
        },
        {
          role: 'user',
          content: '请生成一个适合初次约会或相亲时聊的话题，话题要有趣、温馨，能帮助双方更好地了解彼此。',
        },
      ];

      const response = await this.client.invoke(messages, {
        model: 'doubao-seed-1-6-lite-251015',
        temperature: 0.9,
      });

      const newTopic = {
        id: Date.now(),
        topic: response.content.trim(),
        category: 'AI生成',
      };

      return {
        code: 200,
        data: newTopic,
        message: 'success',
      };
    } catch (error) {
      // 如果AI生成失败，返回预设话题
      const fallbackTopic = this.presetTopics[Math.floor(Math.random() * this.presetTopics.length)];
      return {
        code: 200,
        data: { ...fallbackTopic, id: Date.now() },
        message: 'success',
      };
    }
  }
}
