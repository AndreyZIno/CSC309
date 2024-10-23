import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { id } = req.query;
        const template = await prisma.template.findUnique({
            where: { id: parseInt(id) },
        });

        if (!template) {
            return res.status(404).json({ message: 'Cannot find template' });
        }

        res.status(200).json(template);

    }catch(error) {
        res.status(500).json({ error: 'Cannot fetch template' });
    }
}