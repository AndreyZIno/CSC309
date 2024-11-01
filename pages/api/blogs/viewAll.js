import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const { userEmail } = req.body;

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
            skip: (page - 1) * limit,
            take: parseInt(limit),
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
                user: { select: { firstName: true, lastName: true } },
                templates: true,
                comments: {
                    where: { parentId: null }, //main comments
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
        console.log(error)
        res.status(500).json({ error: 'Could not fetch blog posts' });
    }
}