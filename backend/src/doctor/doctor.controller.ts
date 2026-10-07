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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PublicationType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { DoctorService } from './doctor.service';
import { ApprovedDoctorGuard } from './approved-doctor.guard';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreatePublicationDto } from './dto/create-publication.dto';

@ApiTags('doctor')
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctor: DoctorService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDoctorDto) {
    return this.doctor.register(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.doctor.getMe(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateDoctorDto) {
    return this.doctor.updateMe(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ApprovedDoctorGuard)
  @Get('history')
  history(@CurrentUser() user: AuthUser) {
    return this.doctor.getHistory(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ApprovedDoctorGuard)
  @Get('analytics')
  analytics(@CurrentUser() user: AuthUser) {
    return this.doctor.getAnalytics(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ApprovedDoctorGuard)
  @Get('publications')
  getPublications(
    @CurrentUser() user: AuthUser,
    @Query('type') type?: PublicationType,
    @Query('search') search?: string,
    @Query('mine') mine?: string,
  ) {
    return this.doctor.findAllPublications(user.id, {
      type,
      search,
      mine: mine === 'true',
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ApprovedDoctorGuard)
  @Post('publications')
  createPublication(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePublicationDto,
  ) {
    return this.doctor.createPublication(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ApprovedDoctorGuard)
  @Delete('publications/:id')
  deletePublication(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.doctor.deletePublication(user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ApprovedDoctorGuard)
  @Post('publications/:id/like')
  toggleLike(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.doctor.toggleLike(user.id, id);
  }
}

