import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { MomentsController } from './moments.controller'
import { MomentsService } from './moments.service'

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // 使用内存存储，支持 H5 和小程序
      limits: {
        fileSize: 10 * 1024 * 1024, // 最大 10MB
      },
    }),
  ],
  controllers: [MomentsController],
  providers: [MomentsService],
})
export class MomentsModule {}
