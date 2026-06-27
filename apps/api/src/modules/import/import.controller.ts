import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ImportService } from './import.service';

@Controller('import')
export class ImportController {
  constructor(private readonly imports: ImportService) {}

  @Post('upload')
  @RequirePermissions('import:execute')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.imports.upload(file);
  }

  @Post(':jobId/mapping')
  @RequirePermissions('import:execute')
  mapping(@Param('jobId') jobId: string, @Body() body: Record<string, unknown>) {
    return this.imports.setMapping(jobId, body);
  }

  @Get(':jobId/preview')
  @RequirePermissions('import:execute')
  preview(@Param('jobId') jobId: string) {
    return this.imports.preview(jobId);
  }

  @Post(':jobId/execute')
  @RequirePermissions('import:execute')
  execute(@Param('jobId') jobId: string) {
    return this.imports.execute(jobId);
  }

  @Get(':jobId')
  @RequirePermissions('import:execute')
  getJob(@Param('jobId') jobId: string) {
    return this.imports.getJob(jobId);
  }
}
