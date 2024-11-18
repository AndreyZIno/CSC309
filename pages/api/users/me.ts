import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const ACCESS_SECRET = process.env.ACCESS_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authorization token missing' });

  try {
    const decoded: any = jwt.verify(token, ACCESS_SECRET);
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: { id: true, email: true, firstName: true, avatar: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json(user);
  } catch (err) {
    console.error('Error verifying token:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
