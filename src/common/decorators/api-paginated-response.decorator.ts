import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiPaginatedResponse = <TModel extends Type<unknown>>({
  model,
  description,
}: {
  model?: TModel;
  description?: string;
}) =>
  applyDecorators(
    ApiOkResponse({
      description,
      schema: {
        properties: {
          total: { type: 'number' },
          page: { type: 'number' },
          limit: { type: 'number' },
          data: {
            type: 'array',
            items: model
              ? { $ref: getSchemaPath(model) }
              : { type: 'object' },
          },
        },
      },
    }),
  );
