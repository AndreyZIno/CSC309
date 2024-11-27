import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userEmail } = req.body;
    const { page = '1', limit = '10', search = '', searchField } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

  if (!userEmail) {
      return res.status(400).json({ error: 'You need to be logged in to view your own templates.' });
  }

    try {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let searchCondition = {};
        if (searchField === 'title') {
             searchCondition = search ? {
                OR: [
                    { title: { contains: search } },
                ],
            } : {};
        }
        else if (searchField === 'explanation') {
            searchCondition = search ? {
                OR: [
                    { explanation: { contains: search } },
                ],
            } : {};
        }
        else if (searchField === 'tags') {
            searchCondition = search ? {
                OR: [
                    { tags: { contains: search } },
                ],
            } : {};
        }

      const templates = await prisma.template.findMany({
        where: {
          userId: user.id,
          ...searchCondition, // Apply search filters if provided
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
        tags: template.tags ? template.tags.split(', ') : [], // Ensure tags are an array
      }));

      const totalTemplates = await prisma.template.count({
        where: {
          userId: user.id,
          ...searchCondition, // Count filtered results
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
}
