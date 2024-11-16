// types/next.d.ts
import { User } from '@prisma/client';

declare module 'next' {
  import { NextApiRequest } from 'next';
  interface NextApiRequest {
    user?: { email: string; role: string };
  }
}