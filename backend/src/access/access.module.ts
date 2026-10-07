import { Global, Module } from '@nestjs/common';
import { AccessService } from './access.service';
import { DelegationService } from './delegation.service';
import { AccessController } from './access.controller';

/**
 * Global so AccessService can be injected anywhere (records, reminders,
 * certificates, patients) as the single authorization checkpoint.
 */
@Global()
@Module({
  controllers: [AccessController],
  providers: [AccessService, DelegationService],
  exports: [AccessService],
})
export class AccessModule {}
