import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VaccinesService } from './vaccines.service';
import { CreateVaccineDto } from './dto/create-vaccine.dto';

@ApiTags('vaccines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vaccines')
export class VaccinesController {
  constructor(private readonly vaccines: VaccinesService) {}

  @Get()
  findAll() {
    return this.vaccines.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vaccines.findOne(id);
  }

  // NOTE: catalog management should later be restricted to ADMIN role.
  @Post()
  create(@Body() dto: CreateVaccineDto) {
    return this.vaccines.create(dto);
  }
}
