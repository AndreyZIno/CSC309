import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { content, userEmail, blogPostId, parentId } = req.body;

        if (!content || !userEmail || !blogPostId) {
            return res.status(400).json({ message: 'Content, userEmail and blogPostId are required' });
        }

        const currUser = await prisma.user.findUnique({
            where: { email: userEmail },
          });
        
        if (!currUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                user: { connect: { id: currUser.id } },
                blogPost: { connect: { id: blogPostId } },
                parent: parentId ? { connect: { id: parentId } } : undefined,
            },
        });

        res.status(201).json(comment);

    }catch(error) {
        res.status(500).json({ error: 'Could not create comment' });
    }
});