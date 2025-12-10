import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Role } from '../auth/role.enum.js';
import { StatisticsService } from './statistics.service.js';
import { AdminOverviewDto, ErrorResponseDto } from '../common/swagger/swagger.models.js';

@ApiTags('statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller({ path: 'statistics', version: '1' })
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('admin-overview')
  @ApiOperation({ summary: 'Administrative overview' })
  @ApiOkResponse({ description: 'Aggregated shop statistics', type: AdminOverviewDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role', type: ErrorResponseDto })
  getAdminOverview() {
    return this.statisticsService.getAdminOverview();
  }
}
