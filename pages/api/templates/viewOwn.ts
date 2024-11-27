import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const userEmail = req.user?.email;
    const { page = '1', limit = '10', search = '', searchField = 'title' } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    try {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const searchConditions = search
        ? {
            [searchField as string]: {
              contains: search as string,
              mode: 'insensitive',
            },
          }
        : {};

      const templates = await prisma.template.findMany({
        where: {
          userId: user.id,
          ...searchConditions, // Apply search filters if provided
        },
        skip,
        take: limitNumber,
        include: {
          blogPosts: {
            select: {
              id: true,
              title: true,
              description: true,
              tags: true,
              createdAt: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          user: true, // Include user information
        },
        orderBy: { createdAt: 'desc' },
      });

      const processedTemplates = templates.map((template) => ({
        ...template,
        tags: template.tags.split(','),
        blogs: template.blogPosts,
      }));

      const totalTemplates = await prisma.template.count({
        where: {
          userId: user.id,
          ...searchConditions, // Count filtered results
        },
      });

      return res.status(200).json({
        templates: processedTemplates,
        page: pageNumber,
        limit: limitNumber,
        totalTemplates,
      });
    } catch (error) {
      console.error('Error retrieving templates:', error);
      return res.status(500).json({ error: 'Error retrieving templates' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});
