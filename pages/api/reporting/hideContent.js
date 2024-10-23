import { PrismaClient } from '@prisma/client';
import { authorizeAdmin } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authorizeAdmin(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { blogPostId, commentId } = req.body;

        if (blogPostId) {
            const blogPost = await prisma.blogPost.update({
                where: { id: blogPostId },
                data: { hidden: true },
            });

            return res.status(200).json({ message: 'Blog post hidden successfully', blogPost });
        }

        if (commentId) {
            const comment = await prisma.comment.update({
                where: { id: commentId },
                data: { hidden: true },
            });

            return res.status(200).json({ message: 'Comment hidden successfully', comment });
        }

        return res.status(400).json({ message: 'Please provide a blogPostId or commentId' });

    } catch (error) {
        return res.status(500).json({ message: 'Error hiding content' });
    }
});
