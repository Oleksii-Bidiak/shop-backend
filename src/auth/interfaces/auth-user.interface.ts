import { Role } from '../role.enum.js';

export interface AuthUser {
  sub: number;
  email: string;
  role: Role;
}
