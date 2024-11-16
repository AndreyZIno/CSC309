import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface DeleteBlogRequest extends NextApiRequest {
    body: {
        userEmail: string;
    };
    query: {
        blogID: string;
    };
}

export default async function handler(req: DeleteBlogRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { blogID } = req.query;
        const { userEmail } = req.body;
    
        if (!userEmail) {
            return res.status(400).json({ message: 'userEmail is required' });
        }

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

        if (blogPost.userId !== currUser.id) {
            return res.status(403).json({ message: 'You cannot delete blog posts created by others' });
        }

        await prisma.blogPost.delete({
            where: { id: parseInt(blogID) },
        });

        res.status(200).json({ message: 'Blog post deleted successfully' });

    }catch(error) {
        console.log(error)
        res.status(500).json({ error: 'Could not delete blog post' });
    }
}