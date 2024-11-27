import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EditBlogRequest extends NextApiRequest {
    body: {
        title?: string;
        description?: string;
        tags?: string;
        templateIds?: number[];
        userEmail: string;
    };
    query: {
        blogID: string;
    };
}

export default async function handler(req: EditBlogRequest, res: NextApiResponse) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { blogID } = req.query;
        const { title, description, tags, templateIds, userEmail } = req.body;

        const currUser = await prisma.user.findUnique({
            where: { email: userEmail },
        });

        if (!currUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const blogPost = await prisma.blogPost.findUnique({
            where: { id: parseInt(blogID) },
        });

        if (!blogPost) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        if (blogPost.hidden) {
            return res.status(403).json({ message: 'You cannot edit a hidden blog post.' });
        }

        let sanitizedTags = [];
        let formattedTags = '';
        if (tags) {
            sanitizedTags = tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag !== '');
            formattedTags = sanitizedTags.join(',');
        }
        
        const data: {
            title?: string;
            description?: string;
            tags?: string;
            templates?: { set: []; connect: { id: number }[] } | undefined;
        } = { title, description, tags };

        if (templateIds && templateIds.length > 0) {
            data.templates = { set: [], connect: templateIds.map(id => ({ id })) };
        }

        const updatedBlogPost = await prisma.blogPost.update({
            where: { id: parseInt(blogID) },
            data,
        });

        res.status(200).json(updatedBlogPost);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not edit blog post' });
    }
}