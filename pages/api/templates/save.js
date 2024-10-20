import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req, res) {
    if (req.method === 'POST') {
      const { title, explanation, language, code, tags } = req.body;
      const userEmail = req.user.email;
  
      if (!userEmail) {
        return res.status(401).json({ error: 'User email is missing' });
      }
  
      try {
        // Find the user by email
        const user = await prisma.user.findUnique({
          where: { email: userEmail },
        });
  
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
  
        const newTemplate = await prisma.template.create({
          data: {
            title,
            explanation,
            language,
            code,
            tags: tags.join(','),  // Convert array to comma-separated string
            userId: user.id,        // Use user ID obtained from the email lookup
          },
        });
        return res.status(201).json({ message: 'Template saved', newTemplate });
      } catch (error) {
        console.error('Error saving template:', error); // Log the actual error
        return res.status(500).json({ error: 'Error saving template', details: error.message });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });