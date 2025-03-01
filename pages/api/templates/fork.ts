import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { templateId, modifiedCode }: { templateId: number; modifiedCode?: string } = req.body;
        const userEmail = req.user?.email;

        try {
            const user = await prisma.user.findUnique({
                where: { email: userEmail },
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const originalTemplate = await prisma.template.findUnique({
                where: { id: templateId },
            });

            if (!originalTemplate) {
                return res.status(404).json({ error: 'Template not found' });
            }

            const forkedTitle = `Forked by ${user.firstName}: ${originalTemplate.title}`;

            const forkedTemplate = await prisma.template.create({
                data: {
                    title: forkedTitle,
                    explanation: originalTemplate.explanation,
                    language: originalTemplate.language,
                    code: modifiedCode || originalTemplate.code,
                    tags: originalTemplate.tags,
                    forked: true,
                    userId: user.id,
                },
            });

            return res.status(201).json({ message: 'Template forked', forkedTemplate });
        } catch (error) {
            return res.status(500).json({ error: 'Error forking template' });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
});
