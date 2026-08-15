import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { AdminService } from './admin.service';
import { SetRoleDto } from './dto/set-role.dto';
import {
  ProviderDto,
  UpdateProviderDto,
  UpdateVaccineDto,
  VaccineDto,
} from './dto/catalog.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.getStats();
  }

  @Get('users')
  users() {
    return this.admin.getUsers();
  }

  @Get('users/:id')
  userDetail(@Param('id') id: string) {
    return this.admin.getUserDetail(id);
  }

  @Patch('users/:id/role')
  setRole(@Param('id') id: string, @Body() dto: SetRoleDto) {
    return this.admin.setUserRole(id, dto.role);
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    if (id === me.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    return this.admin.deleteUser(id);
  }

  @Delete('patients/:id')
  deletePatient(@Param('id') id: string) {
    return this.admin.deletePatient(id);
  }

  // ---- Vaccine catalog ----
  @Get('vaccines')
  vaccines() {
    return this.admin.listVaccines();
  }

  @Post('vaccines')
  createVaccine(@Body() dto: VaccineDto) {
    return this.admin.createVaccine(dto);
  }

  @Patch('vaccines/:id')
  updateVaccine(@Param('id') id: string, @Body() dto: UpdateVaccineDto) {
    return this.admin.updateVaccine(id, dto);
  }

  @Delete('vaccines/:id')
  deleteVaccine(@Param('id') id: string) {
    return this.admin.deleteVaccine(id);
  }

  // ---- Providers ----
  @Get('providers')
  providers() {
    return this.admin.listProviders();
  }

  @Post('providers')
  createProvider(@Body() dto: ProviderDto) {
    return this.admin.createProvider(dto);
  }

  @Patch('providers/:id')
  updateProvider(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.admin.updateProvider(id, dto);
  }

  @Delete('providers/:id')
  deleteProvider(@Param('id') id: string) {
    return this.admin.deleteProvider(id);
  }

  // ---- Oversight (read-only) ----
  @Get('certificates')
  certificates() {
    return this.admin.listCertificates();
  }

  @Get('reminders')
  reminders() {
    return this.admin.listReminders();
  }
}
