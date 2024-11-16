import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    const { templateId, title, explanation, code, tags }: { 
      templateId: number; 
      title?: string; 
      explanation?: string; 
      code?: string; 
      tags?: string[] 
    } = req.body;

    const userEmail = req.user?.email;

    try {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const template = await prisma.template.findFirst({
        where: {
          id: templateId,
          userId: user.id,
        },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const updateData: {
        title?: string;
        explanation?: string;
        code?: string;
        tags?: string;
      } = { title, explanation, code };

      if (tags && Array.isArray(tags)) {
        updateData.tags = tags.join(',');
      }

      const updatedTemplate = await prisma.template.update({
        where: { id: template.id },
        data: updateData,
      });

      return res.status(200).json({ message: 'Template updated', updatedTemplate });
    } catch (error) {
      return res.status(500).json({ error: 'Error updating template' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});
