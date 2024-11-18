import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    const { id }: { id: number } = req.body;
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
          id,
          userId: user.id,
        },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found or unauthorized' });
      }

      await prisma.template.delete({
        where: { id: template.id },
      });

      return res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error deleting template:', error);
      return res.status(500).json({ error: 'Error deleting template' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});
