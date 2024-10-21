import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authenticate(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { commentId, voteType, userEmail } = req.body;

        if (voteType !== 'upvote' && voteType !== 'downvote') {
            return res.status(400).json({ message: 'Invalid rating type, either upvote or downvote it, you either like it or do not' });
        }

        const currUser = await prisma.user.findUnique({
            where: { email: userEmail },
          });
        
        if (!currUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        //Check if user already voted
        const existingVote = await prisma.vote.findUnique({
            where: {
                user_comment_unique: {
                    userId: currUser.id,
                    commentId: commentId,
                },
            },
        });

        if (existingVote) {
            if (existingVote.voteType === voteType) {
                return res.status(400).json({ message: `You already ${voteType}d this comment. Either change your mind or stop voting` });
            }

            // Change to a different vote type
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

        // user didn't vote yet
        await prisma.vote.create({
            data: {
                voteType,
                user: { connect: { id: currUser.id } },
                comment: { connect: { id: commentId } },
            },
        });

        const updatedComment  = await prisma.comment.update({
            where: { id: commentId  },
            data: {
                numUpvotes: voteType === 'upvote' ? { increment: 1 } : undefined,
                numDownvotes: voteType === 'downvote' ? { increment: 1 } : undefined,
            },
        });
        res.status(200).json(updatedComment);

    }catch(error) {
        console.error(error)
        res.status(500).json({ error: 'Could not rate a comment' });
    }
});

async function checkPositive(voteType, commentId) {
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { numUpvotes: true, numDownvotes: true },
    });

    if (voteType === 'upvote') {
        return comment.numUpvotes > 0;
    } 
    else if (voteType === 'downvote') {
        return comment.numDownvotes > 0;
    }
    return false;
}