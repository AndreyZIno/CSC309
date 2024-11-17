import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const userEmail = req.user?.email;

    const { page = '1', limit = '10' } = req.query;

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

      const templates = await prisma.template.findMany({
        where: { userId: user.id },
        skip,
        take: limitNumber,
      });

      const processedTemplates = templates.map((template) => ({
        ...template,
        tags: template.tags.split(','),
      }));

      const totalTemplates = await prisma.template.count({
        where: { userId: user.id },
      });

      return res.status(200).json({
        templates: processedTemplates,
        page: pageNumber,
        limit: limitNumber,
        totalTemplates,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error retrieving templates' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});
