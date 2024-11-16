import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { authorizeAdmin } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authorizeAdmin(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { page = '1', limit = '10' } = req.query;

    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = parseInt(limit as string, 10);

    const comments = await prisma.comment.findMany({
      skip,
      take,
      include: {
        _count: {
          select: { reports: true },
        },
        user: { select: { firstName: true, lastName: true } },
        blogPost: true,
        replies: true,
      },
      orderBy: {
        reports: { _count: 'desc' },
      },
    });

    res.status(200).json(comments);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Could not fetch reported comments';
    res.status(500).json({ error: errorMessage });
  }
});
