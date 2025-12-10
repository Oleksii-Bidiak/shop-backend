import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator.js';

import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Role } from '../auth/role.enum.js';
import { CreateVariantDto } from './dto/create-variant.dto.js';
import { UpdateVariantDto } from './dto/update-variant.dto.js';
import { VariantQueryDto } from './dto/variant-query.dto.js';
import { VariantsService } from './variants.service.js';
import { ErrorResponseDto, VariantModel } from '../common/swagger/swagger.models.js';

@ApiTags('variants')
@Controller({ path: 'variants', version: '1' })
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create variant',
    description: 'Requires MANAGER or ADMIN roles.',
  })
  @ApiResponse({ status: 201, type: VariantModel, description: 'Variant created' })
  @ApiBadRequestResponse({ description: 'Validation failed', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Insufficient role', type: ErrorResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  create(@Body() dto: CreateVariantDto) {
    return this.variantsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List variants with filters' })
  @ApiPaginatedResponse({ description: 'List variants with filters', model: VariantModel })
  @ApiBadRequestResponse({ description: 'Invalid filters', type: ErrorResponseDto })
  findAll(@Query() query: VariantQueryDto) {
    return this.variantsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get variant by id' })
  @ApiOkResponse({ type: VariantModel })
  @ApiNotFoundResponse({ description: 'Variant not found', type: ErrorResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.variantsService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update variant',
    description: 'Requires MANAGER or ADMIN roles.',
  })
  @ApiOkResponse({ type: VariantModel })
  @ApiBadRequestResponse({ description: 'Validation failed', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Insufficient role', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Variant not found', type: ErrorResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVariantDto) {
    return this.variantsService.update(id, dto);
  }
}
