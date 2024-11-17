import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface VoteCommentRequest extends NextApiRequest {
    body: {
        commentId: number;
        voteType: 'upvote' | 'downvote';
        userEmail: string;
    };
}

export default async function handler(req: VoteCommentRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { commentId, voteType, userEmail } = req.body;

        if (!voteType || !userEmail) {
            return res.status(400).json({ error: 'Please provide a vote type and userEmail.' });
        }

        const currUser = await prisma.user.findUnique({
            where: { email: userEmail },
        });

        if (!currUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const existingVote = await prisma.vote.findUnique({
            where: {
                user_comment_unique: {
                    userId: currUser.id,
                    commentId,
                },
            },
        });

        if (existingVote) {
            if (existingVote.voteType === voteType) {
                return res.status(400).json({ error: `You already ${voteType}d this comment.` });
            }

            await prisma.vote.update({
                where: { id: existingVote.id },
                data: { voteType },
            });

            const updatedComment = await prisma.comment.update({
                where: { id: commentId },
                data: {
                    numUpvotes: voteType === 'upvote'
                        ? { increment: 1 }
                        : (existingVote.voteType === 'upvote' && await checkPositive('upvote', commentId) ? { decrement: 1 } : undefined),
                    numDownvotes: voteType === 'downvote'
                        ? { increment: 1 }
                        : (existingVote.voteType === 'downvote' && await checkPositive('downvote', commentId) ? { decrement: 1 } : undefined),
                },
            });

            return res.status(200).json(updatedComment);
        }

        await prisma.vote.create({
            data: {
                voteType,
                user: { connect: { id: currUser.id } },
                comment: { connect: { id: commentId } },
            },
        });

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: {
                numUpvotes: voteType === 'upvote' ? { increment: 1 } : undefined,
                numDownvotes: voteType === 'downvote' ? { increment: 1 } : undefined,
            },
        });

        res.status(200).json(updatedComment);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not rate a comment' });
    }
}
//return type is Promise<boolean>, Promise since it's async (uses await to get stuff from db), and resolved value is a bool
async function checkPositive(voteType: 'upvote' | 'downvote', commentId: number): Promise<boolean> {
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { numUpvotes: true, numDownvotes: true },
    });

    if (!comment) return false;

    if (voteType === 'upvote') {
        return comment.numUpvotes > 0;
    } 
    else if (voteType === 'downvote') {
        return comment.numDownvotes > 0;
    }
    return false;
}