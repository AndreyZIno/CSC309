import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

interface ViewAllRequest extends NextApiRequest {
    query: {
        page?: string;
        limit?: string;
        search?: string;
    };
    body: {
        userEmail?: string;
    };
}

export default async function handler(req: ViewAllRequest, res: NextApiResponse) {

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { page = '1', limit = '10', search = '' } = req.query;
        const { userEmail } = req.body;

        const currentPage = parseInt(page);
        const pageSize = parseInt(limit);

        let currUser = null;
        let isAdmin = false;

        if (userEmail) {
            currUser = await prisma.user.findUnique({
                where: { email: userEmail },
            });
            isAdmin = currUser?.role === 'ADMIN';
        }

        const searchCondition = search ? {
            OR: [  // this block of code is from ChatGPT, how to search:
                { title: { contains: search } },
                { description: { contains: search } },
                { tags: { contains: search } },
                { templates: { some: { title: { contains: search } } } },
            ],
        } : {};

        const blogPosts = await prisma.blogPost.findMany({
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            where: {
                AND: [
                    searchCondition,
                    {
                        OR: [
                            { hidden: false },
                            { hidden: true, userId: currUser?.id },
                            ...(isAdmin ? [{ hidden: true }] : []),
                        ],
                    },
                ],
            },
            include: {
                user: { 
                    select: { 
                        firstName: true, 
                        lastName: true, 
                        email: true, 
                        id: true
                    } 
                },
                templates: true,
                comments: {
                    where: { parentId: null },
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        replies: {
                            include: {
                                user: { select: { firstName: true, lastName: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });        

        res.status(200).json(blogPosts);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch blog posts' });
    }
}