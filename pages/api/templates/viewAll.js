import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { page = 1, pageSize = 10, search = '' } = req.query;
        const skip = (page - 1) * pageSize;
        const take = parseInt(pageSize);

        const searchCondition = search ? {
                  OR: [
                      { title: { contains: search} },
                      { tags: { contains: search} },
                      { explanation: { contains: search} },
                  ],
              } : {};

        const templates = await prisma.template.findMany({
            skip,
            take,
            where: searchCondition,
            include: {
                blogPosts: true,
            }
        });

        const processedTemplates = templates.map((template) => ({
            ...template,
            tags: template.tags.split(','),
        }));

        console.log(processedTemplates);
        return res.status(200).json(processedTemplates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        return res.status(500).json({ error: 'Error fetching templates' });
    }
}
