import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req, res) {
  if (req.method === 'PUT') {
    const { id, title, explanation, code, tags } = req.body;
    const userEmail = req.user.email;

    try {
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update the template if it belongs to the user
      const updatedTemplate = await prisma.template.updateMany({
        where: { id, userId: user.id },
        data: { title, explanation, code, tags: tags.join(',') },  // Convert array to comma-separated string
      });

      if (!updatedTemplate.count) {
        return res.status(404).json({ error: 'Template not found or unauthorized' });
      }

      return res.status(200).json({ message: 'Template updated' });
    } catch (error) {
      return res.status(500).json({ error: 'Error updating template' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});
