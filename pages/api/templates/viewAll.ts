import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page = '1', limit = '10', search = '' } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const searchCondition = search
      ? {
          OR: [
            { title: { contains: search as string } },
            { tags: { contains: search as string } },
            { explanation: { contains: search as string } },
          ],
        }
      : {};

    const templates = await prisma.template.findMany({
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      where: searchCondition,
      include: {
        blogPosts: true,
        user: true,
      },
    });

    const processedTemplates = templates.map((template) => ({
      ...template,
      tags: template.tags.split(','),
    }));

    return res.status(200).json(processedTemplates);
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching templates' });
  }
}
