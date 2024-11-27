import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();
const ACCESS_SECRET = process.env.ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.REFRESH_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, password }: { email: string; password: string } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      const tokenData = { email: user.email, role: user.role };
      const accessToken = jwt.sign(tokenData, ACCESS_SECRET, { expiresIn: '60m' });
      const refreshToken = jwt.sign(tokenData, REFRESH_SECRET, { expiresIn: '1d' });

      return res.status(200).json({ accessToken, refreshToken });
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }
}
