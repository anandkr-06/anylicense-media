import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
  } from '@nestjs/common';
  import * as jwt from 'jsonwebtoken';
  
  @Injectable()
  export class JwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers['authorization'];
  
      if (!authHeader) {
        throw new UnauthorizedException('Authorization header missing');
      }
  
      const [type, token] = authHeader.split(' ');
  
      if (type !== 'Bearer' || !token) {
        throw new UnauthorizedException('Invalid authorization format');
      }
  
      try {
        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET is not defined in the environment variables');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
  
        // ✅ attach user to request
        request.user = {
          userId: decoded.userId,
          email: decoded.email,
          roles: decoded.roles,
        };
  
        return true;
      } catch (err) {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
  }
  