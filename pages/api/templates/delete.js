import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { id } = req.body;
    const userEmail = req.user.email;

    try {
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete the template if it belongs to the user
      const deletedTemplate = await prisma.template.deleteMany({
        where: { id, userId: user.id },
      });

      if (!deletedTemplate.count) {
        return res.status(404).json({ error: 'Template not found or unauthorized' });
      }

      return res.status(200).json({ message: 'Template deleted' });
    } catch (error) {
      return res.status(500).json({ error: 'Error deleting template' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});
