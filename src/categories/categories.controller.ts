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
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator.js';

import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Role } from '../auth/role.enum.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CategoryQueryDto } from './dto/category-query.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import {
  CategoryModel,
  CategoryWithProductsModel,
  ErrorResponseDto,
} from '../common/swagger/swagger.models.js';

@ApiTags('categories')
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create category',
    description: 'Requires MANAGER or ADMIN roles.',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created',
    type: CategoryModel,
    examples: {
      created: {
        summary: 'Category created',
        value: {
          id: 1,
          name: 'Headphones',
          slug: 'headphones',
          description: 'Category description',
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    type: ErrorResponseDto,
    examples: {
      badRequest: {
        summary: 'Invalid payload',
        value: {
          statusCode: 400,
          message: ['name should not be empty'],
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid token',
    type: ErrorResponseDto,
    examples: {
      unauthorized: {
        value: {
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Insufficient role',
    type: ErrorResponseDto,
    examples: {
      forbidden: {
        value: {
          statusCode: 403,
          message: 'Forbidden resource',
          error: 'Forbidden',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List categories' })
  @ApiPaginatedResponse({ description: 'List categories', model: CategoryModel })
  @ApiBadRequestResponse({
    description: 'Invalid filters',
    type: ErrorResponseDto,
    examples: {
      badRequest: {
        value: {
          statusCode: 400,
          message: ['limit must not be greater than 50'],
          error: 'Bad Request',
        },
      },
    },
  })
  findAll(@Query() query: CategoryQueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by id' })
  @ApiOkResponse({ type: CategoryWithProductsModel })
  @ApiNotFoundResponse({
    description: 'Category not found',
    type: ErrorResponseDto,
    examples: {
      notFound: {
        value: {
          statusCode: 404,
          message: 'Category 99 not found',
          error: 'Not Found',
        },
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update category',
    description: 'Requires MANAGER or ADMIN roles.',
  })
  @ApiOkResponse({ type: CategoryModel })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    type: ErrorResponseDto,
    examples: {
      badRequest: {
        value: {
          statusCode: 400,
          message: ['slug should not be empty'],
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid token',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Insufficient role',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Category not found',
    type: ErrorResponseDto,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }
}
