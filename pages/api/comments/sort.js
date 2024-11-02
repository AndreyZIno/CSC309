import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { blogPostId, sortByMain = 'mostLiked', sortByReplies = 'mostRecent', page = 1, limit = 10 } = req.query;
        
        if (!blogPostId) {
            return res.status(401).json({ message: 'Please provide blog post ID.' });
        }
        const blogPost = await prisma.blogPost.findUnique({
            where: { id: parseInt(blogPostId) },
        });
        if (!blogPost) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        let sortByMainField = '';
        if (sortByMain === 'mostLiked') {
            sortByMainField = { numUpvotes: 'desc' };
        } 
        else if (sortByMain === 'mostDisliked') {
            sortByMainField = { numDownvotes: 'desc' };
        }
        else if (sortByMain === 'mostRecent') {
            sortByMainField = { createdAt: 'desc' };
        }
        else {
            return res.status(400).json({ message: 'Invalid sorting method for main comments. Use "mostLiked", "mostDisliked" or "mostRecent"' });
        }

        let sortByRepliesField = '';
        if (sortByReplies === 'mostLiked') {
            sortByRepliesField = { numUpvotes: 'desc' };
        } 
        else if (sortByReplies === 'mostDisliked') {
            sortByRepliesField = { numDownvotes: 'desc' };
        } 
        else if (sortByReplies === 'mostRecent') {
            sortByRepliesField = { createdAt: 'desc' };
        } 
        else {
            return res.status(400).json({ message: 'Invalid sorting method for replies. Use "mostLiked", "mostDisliked", or "mostRecent"' });
        }

        const comments = await prisma.comment.findMany({
            where: { blogPostId: parseInt(blogPostId), parentId: null }, // main comments
            skip,
            take,
            orderBy: sortByMainField,
            include: {
                user: { select: { firstName: true, lastName: true } },
                replies: {
                    orderBy: sortByRepliesField, // replies
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                    },
                },
            },
        });

        res.status(200).json(comments);

    }catch(error) {
        return res.status(500).json({ error: 'Could not sort comments' });
    }
}