import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../lib/authentication';

const prisma = new PrismaClient();

interface VoteRequest extends NextApiRequest {
    body: {
        blogPostId: number;
        voteType: 'upvote' | 'downvote';
        userEmail: string;
    };
}

export default authenticate(async function handler(req: VoteRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { blogPostId, voteType, userEmail } = req.body;

        if (!voteType || !userEmail) {
            return res.status(400).json({ message: 'Please provide a vote type and userEmail.' });
        }

        const currUser = await prisma.user.findUnique({
            where: { email: userEmail },
        });

        if (!currUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const blogPost = await prisma.blogPost.findUnique({
            where: { id: blogPostId },
        });

        if (!blogPost) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        const existingVote = await prisma.vote.findUnique({
            where: {
                user_blogpost_unique: {
                    userId: currUser.id,
                    blogPostId,
                },
            },
        });

        if (existingVote) {
            if (existingVote.voteType === voteType) {
                return res.status(400).json({ message: `You already ${voteType}d this post.` });
            }

            await prisma.vote.update({
                where: { id: existingVote.id },
                data: { voteType },
            });
            const updatedBlogPost = await prisma.blogPost.update({
                where: { id: blogPostId },
                data: {
                    numUpvotes: voteType === 'upvote'
                        ? { increment: 1 }
                        : (existingVote.voteType === 'upvote' && await checkPositive('upvote', blogPostId) ? { decrement: 1 } : undefined),
                    numDownvotes: voteType === 'downvote'
                        ? { increment: 1 }
                        : (existingVote.voteType === 'downvote' && await checkPositive('downvote', blogPostId) ? { decrement: 1 } : undefined),
                },
            });

            return res.status(200).json(updatedBlogPost);
        }
        // user didn't vote yet
        await prisma.vote.create({
            data: {
                voteType,
                user: { connect: { id: currUser.id } },
                blogPost: { connect: { id: blogPostId } },
            },
        });

        const updatedBlogPost = await prisma.blogPost.update({
            where: { id: blogPostId },
            data: {
                numUpvotes: voteType === 'upvote' ? { increment: 1 } : undefined,
                numDownvotes: voteType === 'downvote' ? { increment: 1 } : undefined,
            },
        });

        res.status(200).json(updatedBlogPost);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not rate a blog post' });
    }
});

async function checkPositive(voteType: 'upvote' | 'downvote', blogPostId: number): Promise<boolean> {
    const blogPost = await prisma.blogPost.findUnique({
        where: { id: blogPostId },
        select: { numUpvotes: true, numDownvotes: true },
    });

    if (!blogPost) return false;

    if (voteType === 'upvote') {
        return blogPost.numUpvotes > 0;
    } 
    else if (voteType === 'downvote') {
        return blogPost.numDownvotes > 0;
    }
    return false;
}