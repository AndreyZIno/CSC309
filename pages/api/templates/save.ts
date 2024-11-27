import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { title, explanation, language, code, tags }: {
      title: string;
      explanation: string;
      language: string;
      code: string;
      tags: string[];
    } = req.body;

    // Extract the user's email directly from the access token
    const userEmail = req.user?.email;

    if (!userEmail) {
      console.error('Unauthorized: User email is missing in token');
      return res.status(401).json({ error: 'Unauthorized access: User email not found.' });
    }

    try {
      // Find the user in the database using the email decoded from the token
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        console.error('User not found in the database:', userEmail);
        return res.status(404).json({ error: 'User not found' });
      }

      // Log the data being saved
      console.log('Saving new template:', { title, explanation, language, code, tags });

      // Create the new template associated with the user
      const newTemplate = await prisma.template.create({
        data: {
          title,
          explanation,
          language,
          code,
          tags: tags.join(', '), // Ensure this is an array
          userId: user.id, // Use the user's ID from the database
        },
      });

      console.log('Template saved successfully:', newTemplate);
      return res.status(201).json({ message: 'Template saved', newTemplate });
    } catch (error: any) {
      console.error('Error saving template:', error.message); // Log detailed error
      return res.status(500).json({ error: 'Error saving template', details: error.message });
    }
  } else {
    console.error('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }
});
