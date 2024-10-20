import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;
    const take = parseInt(pageSize);

    try {
      // Fetch paginated templates
      const templates = await prisma.template.findMany({
        skip,
        take,
      });

      // Convert the comma-separated tags back to arrays
      const processedTemplates = templates.map(template => ({
        ...template,
        tags: template.tags.split(','),
      }));

      return res.status(200).json(processedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      return res.status(500).json({ error: 'Error fetching templates' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
