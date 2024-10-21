import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { sortBy, page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        let sortByField = '';
        if (sortBy === 'mostLiked') {
            sortByField = { numUpvotes: 'desc' };
        } 
        else if (sortBy === 'mostDisliked') {
            sortByField = { numDownvotes: 'desc' };
        }
        else if (sortBy === 'mostRecent') {
            sortByField = { createdAt: 'desc' };
        }
        else {
            return res.status(400).json({ message: 'Invalid sorting method. Use "mostLiked", "mostDisliked" or "mostRecent"' });
        }

        const blogPosts = await prisma.blogPost.findMany({
            skip,
            take,
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