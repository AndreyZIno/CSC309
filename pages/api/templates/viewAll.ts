import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page = '1', limit = '10', search = '', searchField = "title" } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    let searchCondition = {};
    if (search) {
        switch (searchField) {
            case 'tags':
                searchCondition = { tags: { contains: search as string } };
                break;
            case 'explanation':
                searchCondition = { explanation: { contains: search as string } };
                break;
            default: // Default to 'title'
                searchCondition = { title: { contains: search as string } };
                break;
        }
    }

    const templates = await prisma.template.findMany({
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      where: searchCondition,
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
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const processedTemplates = templates.map((template) => ({
      ...template,
      tags: template.tags.split(','),
      blogs: template.blogPosts,
    }));

    return res.status(200).json(processedTemplates);
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching templates' });
  }
}
