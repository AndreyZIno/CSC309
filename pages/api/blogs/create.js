import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { title, description, tags, templateIds, userEmail } = req.body;
        if (!title || !description || !tags || !userEmail) {
            return res.status(400).json({ message: 'Title, description, tags, and userEmail are required' });
        }

        const currUser = await prisma.user.findUnique({
            where: { email: userEmail },
          });
        
        if (!currUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const data = {
            title,
            description,
            tags,
            user: { connect: { id: currUser.id } },
        };

        if (templateIds && templateIds.length > 0) {
            data.templates = { connect: templateIds.map(id => ({ id })) };
        }

        const blogPost = await prisma.blogPost.create({
            data,
        });

        res.status(201).json(blogPost);

    }catch(error) {
        res.status(500).json({ error: 'Could not create blog post' });
    }
});