import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';

/**
 * PUBLIC controller — no auth guard. This is what a QR scan hits so anyone
 * (an airport, an employer, a school) can confirm a certificate is genuine.
 */
@ApiTags('verify')
@Controller('verify')
export class VerifyController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get(':code')
  verify(@Param('code') code: string) {
    return this.certificates.verifyByCode(code);
  }
}
