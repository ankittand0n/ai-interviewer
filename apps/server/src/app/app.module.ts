import { Module } from '@nestjs/common';
import { JobModule } from '../job/job.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [JobModule], // Import PrismaModule if PrismaService is used
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
