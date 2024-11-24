import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateCommentRequest extends NextApiRequest {
    body: {
        content: string;
        userEmail: string;
        blogPostId: number;
        parentId?: number;
    };
}

export default async function handler(req: CreateCommentRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { content, userEmail, blogPostId, parentId } = req.body;

        if (userEmail === null) {
            return res.status(400).json({ error: 'You need to be logged in to comment or reply' });
        }

        if (!content || !userEmail || !blogPostId) {
            return res.status(400).json({ message: 'Content, userEmail, and blogPostId are required' });
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
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        // Fetch the `hidden` field explicitly
        const commentWithHidden = await prisma.comment.findUnique({
            where: { id: comment.id },
            select: {
                id: true,
                content: true,
                hidden: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        res.status(201).json(commentWithHidden);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not create comment' });
    }
}
