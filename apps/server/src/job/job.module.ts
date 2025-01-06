import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';

@Module({
  imports: [], // Import PrismaModule if PrismaService is used
  controllers: [JobController], // Register JobController
  providers: [JobService],
})
export class JobModule {}
