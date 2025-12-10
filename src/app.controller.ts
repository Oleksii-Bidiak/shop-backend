import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service.js';
import { ErrorResponseDto, StatusResponseDto } from './common/swagger/swagger.models.js';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOkResponse({
    description: 'Service health check',
    type: StatusResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Unexpected server error',
    type: ErrorResponseDto,
    examples: {
      serverError: {
        summary: 'Internal error',
        value: { statusCode: 500, message: 'Internal server error', error: 'Internal Server Error' },
      },
    },
  })
  getStatus() {
    return this.appService.getStatus();
  }
}
