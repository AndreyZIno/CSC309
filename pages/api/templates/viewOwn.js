import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req, res) {
  if (req.method === 'GET') {
    const userEmail = req.user.email;

    try {
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Fetch all templates for the user
      const templates = await prisma.template.findMany({
        where: { userId: user.id },
      });

      // Convert the comma-separated tags back to arrays
      const processedTemplates = templates.map(template => ({
        ...template,
        tags: template.tags.split(','),
      }));

      return res.status(200).json(processedTemplates);
    } catch (error) {
      return res.status(500).json({ error: 'Error retrieving templates' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});
