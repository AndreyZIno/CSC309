import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { id, sortByMain = 'mostLiked', sortByReplies = 'mostRecent', page = '1', limit = '10' } = req.query;

        if (typeof id !== 'string') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const blogPost = await prisma.blogPost.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                templates: true,
            },
        });

        if (!blogPost) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
        const take = parseInt(limit as string, 10);

        let sortByMainField = {};
        switch (sortByMain) {
            case 'mostLiked':
                sortByMainField = { numUpvotes: 'desc' };
                break;
            case 'mostDisliked':
                sortByMainField = { numDownvotes: 'desc' };
                break;
            case 'mostRecent':
                sortByMainField = { createdAt: 'desc' };
                break;
            default:
                return res.status(400).json({ message: 'Invalid sorting method for main comments.' });
        }

        let sortByRepliesField = {};
        switch (sortByReplies) {
            case 'mostLiked':
                sortByRepliesField = { numUpvotes: 'desc' };
                break;
            case 'mostDisliked':
                sortByRepliesField = { numDownvotes: 'desc' };
                break;
            case 'mostRecent':
                sortByRepliesField = { createdAt: 'desc' };
                break;
            default:
                return res.status(400).json({ message: 'Invalid sorting method for replies.' });
        }

        const comments = await prisma.comment.findMany({
            where: { blogPostId: parseInt(id, 10), parentId: null },
            skip,
            take,
            orderBy: sortByMainField,
            include: {
                user: { select: { firstName: true, lastName: true } },
                replies: {
                    orderBy: sortByRepliesField,
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                    },
                },
            },
        });

        res.status(200).json({ ...blogPost, comments });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Cannot fetch blog post or comments.' });
    }
}