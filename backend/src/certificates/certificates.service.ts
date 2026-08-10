import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

// A certificate joined with everything the PDF / verification needs.
type CertWithRecord = Prisma.CertificateGetPayload<{
  include: {
    record: { include: { vaccine: true; patient: true; provider: true } };
  };
}>;

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  private generateCode(): string {
    return 'VL-' + randomBytes(6).toString('hex').toUpperCase();
  }

  private async getOwnedRecord(ownerId: string, recordId: string) {
    const record = await this.prisma.vaccinationRecord.findUnique({
      where: { id: recordId },
      include: { patient: true, certificate: true },
    });
    if (!record) {
      throw new NotFoundException('Record not found');
    }
    if (record.patient.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have access to this record');
    }
    return record;
  }

  /** Issue a certificate for a record (idempotent), and mark the record verified. */
  async issue(ownerId: string, recordId: string) {
    const record = await this.getOwnedRecord(ownerId, recordId);
    if (record.certificate) {
      return record.certificate;
    }
    const cert = await this.prisma.certificate.create({
      data: { recordId, verificationCode: this.generateCode() },
    });
    // Issuing an official certificate marks the record as verified.
    await this.prisma.vaccinationRecord.update({
      where: { id: recordId },
      data: { verified: true },
    });
    return cert;
  }

  findAllForUser(ownerId: string) {
    return this.prisma.certificate.findMany({
      where: { record: { patient: { ownerId } } },
      include: {
        record: {
          include: {
            vaccine: true,
            provider: true,
            patient: { select: { id: true, fullName: true, relation: true } },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findOne(ownerId: string, id: string): Promise<CertWithRecord> {
    const cert = await this.prisma.certificate.findUnique({
      where: { id },
      include: {
        record: { include: { vaccine: true, patient: true, provider: true } },
      },
    });
    if (!cert) {
      throw new NotFoundException('Certificate not found');
    }
    if (cert.record.patient.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have access to this certificate');
    }
    return cert;
  }

  /**
   * PUBLIC: verify a certificate by its code. Returns only non-sensitive fields.
   * Because the data is looked up from our database by an unguessable code,
   * the result cannot be forged.
   */
  async verifyByCode(code: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { verificationCode: code },
      include: {
        record: { include: { vaccine: true, patient: true, provider: true } },
      },
    });
    if (!cert) {
      return { valid: false as const };
    }
    const r = cert.record;
    return {
      valid: true as const,
      certificate: {
        verificationCode: cert.verificationCode,
        issuedAt: cert.issuedAt,
        personName: r.patient.fullName,
        vaccine: r.vaccine.name,
        doseNumber: r.doseNumber,
        totalDoses: r.vaccine.totalDoses,
        dateAdministered: r.dateAdministered,
        provider: r.provider?.name ?? null,
      },
    };
  }

  async generatePdf(ownerId: string, id: string): Promise<Buffer> {
    const cert = await this.findOne(ownerId, id);
    return this.buildPdf(cert);
  }

  private async buildPdf(cert: CertWithRecord): Promise<Buffer> {
    const r = cert.record;
    const verifyUrl = `${this.frontendUrl()}/verify/${cert.verificationCode}`;
    const qrPng = await QRCode.toBuffer(verifyUrl, { width: 220, margin: 1 });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks))),
    );

    // Header band
    doc.rect(0, 0, doc.page.width, 120).fill('#1976D2');
    doc.fillColor('white').fontSize(26).text('Vacciner Log', 50, 42);
    doc.fontSize(14).text('Vaccination Certificate', 50, 78);
    doc.fillColor('black');

    // QR (top-right)
    doc.image(qrPng, doc.page.width - 190, 150, { width: 140 });
    doc
      .fontSize(9)
      .fillColor('#666')
      .text('Scan to verify', doc.page.width - 190, 295, {
        width: 140,
        align: 'center',
      });

    // Details
    let y = 165;
    const field = (label: string, value: string) => {
      doc.fontSize(10).fillColor('#888').text(label.toUpperCase(), 50, y);
      doc.fontSize(14).fillColor('#111').text(value, 50, y + 14);
      y += 48;
    };
    field('Name', r.patient.fullName);
    field(
      'Vaccine',
      `${r.vaccine.name}  —  Dose ${r.doseNumber} of ${r.vaccine.totalDoses}`,
    );
    field('Date administered', new Date(r.dateAdministered).toDateString());
    field('Provider', r.provider?.name ?? 'Not recorded');
    field('Batch number', r.batchNumber ?? '—');

    // Certificate meta box
    y += 10;
    doc.rect(50, y, doc.page.width - 100, 90).fill('#f4f7fb');
    doc.fillColor('#111').fontSize(11);
    doc.text(`Certificate ID:  ${cert.id}`, 65, y + 15);
    doc.text(`Verification code:  ${cert.verificationCode}`, 65, y + 38);
    doc.text(`Issued:  ${new Date(cert.issuedAt).toDateString()}`, 65, y + 61);

    // Footer
    doc
      .fontSize(9)
      .fillColor('#999')
      .text(`Verify this certificate at ${verifyUrl}`, 50, 770, { width: 500 });

    doc.end();
    return done;
  }
}
