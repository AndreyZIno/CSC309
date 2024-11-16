import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

const ACCESS_SECRET = process.env.ACCESS_SECRET as string;

export function verifyJWT(req: NextApiRequest) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token missing or malformed');
  }

  const token = authHeader.split(' ')[1];
  return jwt.verify(token, ACCESS_SECRET) as { email: string; role: string };
}

export function authenticate(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      req.user = verifyJWT(req);
      return await handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
  };
}

export function authorizeAdmin(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return authenticate(async (req, res) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }
    return await handler(req, res);
  });
}
