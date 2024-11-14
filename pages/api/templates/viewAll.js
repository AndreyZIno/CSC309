import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        const searchCondition = search ? {
                  OR: [
                      { title: { contains: search} },
                      { tags: { contains: search} },
                      { explanation: { contains: search} },
                  ],
              } : {};

        const templates = await prisma.template.findMany({
            skip: (page - 1) * limit,
            take: parseInt(limit),
            where: searchCondition,
            include: {
                blogPosts: true,
            }
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
