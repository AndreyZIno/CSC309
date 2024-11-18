import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

/*
interface CreateBlogRequest extends NextApiRequest {
    body: {
      title: string;
      description: string;
      tags: string;
      templateIds?: number[];
    };
    user?: { email: string; role: string };
}
*/

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse) {
    
    if (req.method === 'POST') {
        const { title, description, tags, templateIds }: {
            title: string;
            description: string;
            tags: string[];
            templateIds: number[];
        } = req.body;

        const userEmail = req.user?.email;

        if (!userEmail) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const user = await prisma.user.findUnique({
                where: { email: userEmail },
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const blogPost = await prisma.blogPost.create({
                data: {
                    title,
                    description,
                    tags: tags.join(','),
                    userId: user.id,
                    templates: templateIds?.length ? { connect: templateIds.map(id => ({ id })) } : undefined,
                },
            });

            return res.status(201).json({ message: 'Blog saved', blogPost });
        } catch (error: any) {
            console.log(error)
            return res.status(500).json({ error: 'Error saving blog', details: error.message });
        }

    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
});
    /*
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, description, tags, templateIds } = req.body;

    if (!title || !description || !tags) {
        return res.status(400).json({ error: 'Title, description, and tags are required.' });
    }
  
    const userEmail = req.user?.email;
  
    if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {

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
            userId: currUser.id,
            templates: templateIds?.length ? { connect: templateIds.map(id => ({ id })) } : undefined,
        };

        const blogPost = await prisma.blogPost.create({ data });

        res.status(201).json(blogPost);

    }catch(error) {
        console.log(error)
        res.status(500).json({ error: 'Could not create blog post' });
    }
    */