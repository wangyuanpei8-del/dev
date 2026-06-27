import { Module } from '@nestjs/common';
import { AuditService } from '../../common/services/audit.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AuditService],
})
export class UsersModule {}
