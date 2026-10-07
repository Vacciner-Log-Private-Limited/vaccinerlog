import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

@ApiTags('records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('records')
export class RecordsController {
  constructor(private readonly records: RecordsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRecordDto) {
    return this.records.create(user.id, dto);
  }

  // Declared before ':id' so "summary" is not matched as a record id.
  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.records.summary(user.id);
  }

  @Get()
  @ApiQuery({ name: 'patientId', required: false })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('patientId') patientId?: string,
  ) {
    return this.records.findAllForUser(user.id, patientId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.records.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRecordDto,
  ) {
    return this.records.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.records.remove(user.id, id);
  }
}
