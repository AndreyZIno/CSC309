import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SortBlogRequest extends NextApiRequest {
    query: {
        sortBy: 'mostLiked' | 'mostDisliked' | 'mostRecent';
        page?: string;
        limit?: string;
        search?: string;
        searchField?: 'title' | 'description' | 'tags' | 'templates';
    };
}

export default async function handler(req: SortBlogRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { sortBy, page = '1', limit = '10', search = '', searchField = 'title' } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        let sortByField = {};
        switch (sortBy) {
            case 'mostLiked':
                sortByField = { numUpvotes: 'desc' };
                break;
            case 'mostDisliked':
                sortByField = { numDownvotes: 'desc' };
                break;
            case 'mostRecent':
                sortByField = { createdAt: 'desc' };
                break;
            default:
                return res.status(400).json({ message: 'Invalid sorting method. Use "mostLiked", "mostDisliked" or "mostRecent"' });
        }

        const searchCondition = search ? {      // TO DO: Fix search by categories, right now searches all
            OR: [  // this block of code is from ChatGPT, how to search:
                { title: { contains: search } },
                { description: { contains: search } },
                { tags: { contains: search } },
                { templates: { some: { title: { contains: search } } } },
            ],
        } : {};

        const blogPosts = await prisma.blogPost.findMany({
            skip,
            take,
            orderBy: sortByField,
            where: searchCondition,
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                templates: true,
                comments: true,
            },
        });

        res.status(200).json(blogPosts);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Could not sort blog posts' });
    }
}