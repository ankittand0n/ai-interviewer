import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';

import { JobService } from './job.service';


@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  async extractTags(@Body() body: { jobTitle: string ,jobDescription: string }) {
    return this.jobService.extractTags(body.jobTitle, body.jobDescription); 
  }

  @Patch('sync-tags')
  async syncTags() {
    return this.jobService.syncTags(); 
  }

  @Get()
  async getAllTags() {
    return this.jobService.getAllTags();
  }

  @Patch('update-priority/:id')
  async updatePriority(
    @Param('id') atsTagId: string,
    @Body() updatedTags: { name: string; priority: number }[],
  ) {
    return this.jobService.updateTagPriority(parseInt(atsTagId, 10), updatedTags.name, updatedTags.priority);
  }
}
