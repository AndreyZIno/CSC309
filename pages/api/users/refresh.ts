import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

const ACCESS_SECRET = process.env.ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.REFRESH_SECRET as string;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is missing' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { username: string; role: string };
    const accessToken = jwt.sign(
      { username: decoded.username, role: decoded.role },
      ACCESS_SECRET,
      { expiresIn: '60m' }
    );

    return res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}
