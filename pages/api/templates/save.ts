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

    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ error: 'User email is missing' });
    }

    try {
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
          tags: tags.join(','),
          userId: user.id,
        },
      });

      return res.status(201).json({ message: 'Template saved', newTemplate });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error saving template', details: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});
