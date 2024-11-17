import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const blogPost = await prisma.blogPost.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        templates: true,
        comments: {
          where: { parentId: null }, // Main comments
          include: {
            user: { select: { firstName: true, lastName: true } },
            replies: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!blogPost) {
      return res.status(404).json({ message: 'Cannot find blog post' });
    }

    res.status(200).json(blogPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Cannot fetch blog post' });
  }
}
