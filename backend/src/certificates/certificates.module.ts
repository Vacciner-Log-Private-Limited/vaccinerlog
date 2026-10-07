import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { VerifyController } from './verify.controller';

@Module({
  controllers: [CertificatesController, VerifyController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
