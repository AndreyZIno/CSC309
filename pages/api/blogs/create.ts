import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface CreateBlogRequest extends NextApiRequest {
    body: {
        title: string;
        description: string;
        tags: string;
        templateIds?: number[];
        userEmail: string;
    };
}

export default async function handler(req: CreateBlogRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { title, description, tags, templateIds, userEmail } = req.body;
        if (!title || !description || !tags || !userEmail) {
            return res.status(400).json({ error: 'Title, description, tags, and userEmail are required' });
        }

        const currUser = await prisma.user.findUnique({
            where: { email: userEmail },
          });
        
        if (!currUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const data = {
            title,
            description,
            tags,
            user: { connect: { id: currUser.id } },
            templates: templateIds?.length ? { connect: templateIds.map(id => ({ id })) } : undefined,
        };

        const blogPost = await prisma.blogPost.create({ data });

        res.status(201).json(blogPost);

    }catch(error) {
        console.log(error)
        res.status(500).json({ error: 'Could not create blog post' });
    }
}