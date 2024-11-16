import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; Max-Age=0; Path=/');
    return res.status(200).json({ message: 'Logged out successfully' });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
