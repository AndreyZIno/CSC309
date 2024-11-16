import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface CreateReportRequest extends NextApiRequest {
    body: {
        blogPostId?: number;
        commentId?: number;
        reason: string;
        userEmail: string;
    };
}

export default authenticate(async function handler(req: CreateReportRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { blogPostId, commentId, reason, userEmail } = req.body;

        if (!userEmail) {
            return res.status(400).json({ message: 'userEmail is required' });
        }

        const currUser = await prisma.user.findUnique({
            where: { email: userEmail },
        });
        if (!currUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!reason || reason.length < 3) {
            return res.status(400).json({ message: 'Please provide a reason, and reason must be at least 3 characters.' });
        }

        if (!(blogPostId || commentId)) {
            return res.status(400).json({ message: 'Please say which blogPostId or commentId you want to report.' });
        }

        if (blogPostId) {
            const blogPost = await prisma.blogPost.findUnique({ where: { id: blogPostId } });
            if (!blogPost) {
                return res.status(404).json({ message: 'Blog post not found.' });
            }
        } 
        else if (commentId) {
            const comment = await prisma.comment.findUnique({ where: { id: commentId } });
            if (!comment) {
                return res.status(404).json({ message: 'Comment not found.' });
            }
        }

        const report = await prisma.report.create({
            data: {
                reason,
                user: { connect: { id: currUser.id } },
                blogPost: blogPostId ? { connect: { id: blogPostId } } : undefined,
                comment: commentId ? { connect: { id: commentId } } : undefined,
            },
        });

        res.status(201).json(report);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not create report' });
    }
});