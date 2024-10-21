/* Visitors can sort by most liked (most upvotes) or most disliked (blogs with most downvotes) */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {   // TODO: Pagination
        const { sortBy } = req.query;
        let sortByField = '';
        if (sortBy === 'mostLiked') {
            sortByField = { numUpvotes: 'desc' };
        } 
        else if (sortBy === 'mostDisliked') {
            sortByField = { numDownvotes: 'desc' };
        } 
        else {
            return res.status(400).json({ message: 'Invalid sorting method. Use "mostLiked" or "mostDisliked"' });
        }

        const blogPosts = await prisma.blogPost.findMany({
            orderBy: sortByField,
            include: {
                user: { select: { firstName: true, lastName: true } },
                templates: true,
                comments: true,
            },
        });

        res.status(200).json(blogPosts);

    }catch(error) {
        return res.status(500).json({ error: 'Could not sort blog posts' });
    }
}