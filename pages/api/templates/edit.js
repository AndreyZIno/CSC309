import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req, res) {
  if (req.method === 'PUT') {
    const { title, explanation, code, tags } = req.body;  // We are not using `id`
    const userEmail = req.user.email; // Get user email from JWT token

    try {
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Find the first template that belongs to the user
      const template = await prisma.template.findFirst({
        where: {
          userId: user.id,  // Ensure it belongs to the authenticated user
        },
      });

      if (!template) {
        return res.status(404).json({ error: 'No template found for this user' });
      }

      // Convert tags to comma-separated string if provided, otherwise skip updating tags
      const updateData = {
        title,
        explanation,
        code,
      };

      if (tags && Array.isArray(tags)) {
        updateData.tags = tags.join(',');  // Convert array to comma-separated string
      }

      // Update the first template found for this user
      const updatedTemplate = await prisma.template.update({
        where: { id: template.id },  // Use the template id to update
        data: updateData,
      });

      return res.status(200).json({ message: 'Template updated', updatedTemplate });
    } catch (error) {
      console.error('Error updating template:', error);
      return res.status(500).json({ error: 'Error updating template' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});
