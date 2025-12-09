import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthUser } from '../../auth/interfaces/auth-user.interface.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
