import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface SortCommentsRequest extends NextApiRequest {
    query: {
        blogPostId: string;
        sortByMain?: 'mostLiked' | 'mostDisliked' | 'mostRecent';
        sortByReplies?: 'mostLiked' | 'mostDisliked' | 'mostRecent';
        page?: string;
        limit?: string;
    };
}

export default async function handler(req: SortCommentsRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { blogPostId, sortByMain = 'mostLiked', sortByReplies = 'mostRecent', page = '1', limit = '10' } = req.query;

        if (!blogPostId) {
            return res.status(400).json({ message: 'Please provide blog post ID.' });
        }

        const blogPost = await prisma.blogPost.findUnique({
            where: { id: parseInt(blogPostId) },
        });

        if (!blogPost) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

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
                return res.status(400).json({ message: 'Invalid sorting method for main comments. Use "mostLiked", "mostDisliked" or "mostRecent"' });
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

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Could not sort comments' });
    }
}