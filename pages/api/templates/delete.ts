import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

interface DeleteTemplateRequest extends NextApiRequest {
  body: {
    userEmail: string;
  };
  query: {
    templateID: string;
  };
}

export default async function handler(req: DeleteTemplateRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { templateID } = req.query;
    const { userEmail } = req.body;

    if (!templateID) {
      return res.status(400).json({ message: 'templateID is required' });
    }

    if (!userEmail) {
      return res.status(400).json({ message: 'userEmail is required' });
    }

    // Verify authenticated user email matches the provided email
    const authenticatedUserEmail = req.user?.email;
    if (!authenticatedUserEmail || authenticatedUserEmail !== userEmail) {
      return res.status(403).json({ message: 'Unauthorized access: Email mismatch' });
    }

    // Fetch the user based on the email
    const currUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!currUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fetch the template by ID
    const template = await prisma.template.findUnique({
      where: { id: parseInt(templateID, 10) },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if the template belongs to the user
    if (template.userId !== currUser.id) {
      return res.status(403).json({ message: 'You cannot delete templates created by others' });
    }

    // Delete the template
    await prisma.template.delete({
      where: { id: parseInt(templateID, 10) },
    });

    res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Could not delete template' });
  }
}
