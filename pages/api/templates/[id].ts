import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const template = await prisma.template.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ message: 'Cannot find template' });
    }

    // Convert tags from string to an array
    const formattedTemplate = {
      ...template,
      tags: template.tags ? template.tags.split(',') : [],
    };

    res.status(200).json(formattedTemplate);
  } catch (error) {
    res.status(500).json({ error: 'Cannot fetch template' });
  }
}
