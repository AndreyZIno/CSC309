import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

interface BlogPost {
    id: number;
    title: string;
    description: string;
    tags: string;
    numUpvotes: number;
    numDownvotes: number;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
    templates: {
        id: number;
        title: string;
    }[];
    comments: {
        id: number;
        content: string;
        user: { firstName: string; lastName: string };
        replies: {
            id: number;
            content: string;
            user: { firstName: string; lastName: string };
        }[];
    }[];
}

const BlogDetails: React.FC = () => {
    const router = useRouter();
    const { id } = router.query;
    const [blog, setBlog] = useState<BlogPost | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [newComment, setNewComment] = useState<string>('');
    const [replyComment, setReplyComment] = useState<{ [key: number]: string }>({});
    const [userEmail, setUserEmail] = useState('JohnDoe@gmail.com'); // Hardcoded for now

    const fetchBlog = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/blogs/${id}`);
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch the blog post.');
                return;
            }

            const data = await response.json();
            setBlog(data);
        } catch (err) {
            console.error('Error fetching blog:', err);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !id) return;

        try {
            const response = await fetch(`/api/comments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment,
                    blogPostId: Number(id),
                    userEmail: 'JohnDoe@gmail.com',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || `Could not add comment.`);
                return;
            }

            setNewComment('');
            fetchBlog();
        } catch (err) {
            console.error(err);
            setError('Could not add the comment.');
        }
    };

    const handleAddReply = async (parentId: number) => {
        if (!replyComment[parentId]?.trim() || !id) return;

        try {
            const response = await fetch(`/api/comments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: replyComment[parentId],
                    blogPostId: Number(id),
                    userEmail: 'JohnDoe@gmail.com',
                    parentId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || `Could not add comment.`);
                return;
            }

            setReplyComment((prev) => ({ ...prev, [parentId]: '' }));
            fetchBlog();
        } catch (err) {
            console.error(err);
            setError('Could not add the reply.');
        }
    };

    const handleVote = async (commentId: number, voteType: 'upvote' | 'downvote') => {
        try {
            const response = await fetch('/api/comments/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId, voteType, userEmail }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to vote on the comment.');
                return;
            }

            fetchBlog();
        } catch (err) {
            console.error('Error voting on comment:', err);
            setError('Could not vote on the comment.');
        }
    };

    useEffect(() => {
        fetchBlog();
    }, [id]);

    if (loading) {
        return <p className="text-center">Loading...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500">{error}</p>;
    }

    if (!blog) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <h1 className="text-3xl font-semibold text-blue-700 mb-4">{blog.title}</h1>
            <p className="text-sm text-gray-500">
                By {blog.user.firstName} {blog.user.lastName} | {new Date(blog.createdAt).toLocaleDateString()}
            </p>
            <p className="text-gray-700 mt-4">{blog.description}</p>
            <p className="text-sm text-gray-500 mt-4">
                Tags: <span className="italic">{blog.tags}</span>
            </p>

            <div className="mt-4 flex items-center gap-4">
                <p className="text-green-500 font-semibold">Upvotes: {blog.numUpvotes}</p>
                <p className="text-red-500 font-semibold">Downvotes: {blog.numDownvotes}</p>
            </div>

            {blog.templates.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold text-black">Templates:</h3>
                    <ul className="list-disc list-inside">
                        {blog.templates.map((template) => (
                            <li key={template.id}>
                                <Link href={`/templates/${template.id}`} className="text-blue-500 hover:underline">
                                    {template.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-6">
                <h3 className="text-lg font-semibold text-black">Comments:</h3>
                {blog.comments.length > 0 ? (
                    <ul className="space-y-4">
                        {blog.comments.map((comment) => (
                            <li key={comment.id} className="border border-gray-300 p-4 rounded-md text-black">
                                <p>
                                    <strong>{comment.user.firstName} {comment.user.lastName}:</strong> {comment.content}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                    <button
                                        onClick={() => handleVote(comment.id, 'upvote')}
                                        className="text-green-500 flex items-center gap-1"
                                        title="Upvote"
                                    >
                                        <FaThumbsUp size={16} />
                                        {comment.numUpvotes}
                                    </button>
                                    <button
                                        onClick={() => handleVote(comment.id, 'downvote')}
                                        className="text-red-500 flex items-center gap-1"
                                        title="Downvote"
                                    >
                                        <FaThumbsDown size={16} /> 
                                        {comment.numDownvotes}
                                    </button>
                                </div>
                                <textarea
                                    className="w-full mt-2 p-2 border border-gray-300 rounded-md text-black"
                                    placeholder="Reply to this comment"
                                    value={replyComment[comment.id] || ''}
                                    onChange={(e) =>
                                        setReplyComment((prev) => ({ ...prev, [comment.id]: e.target.value }))
                                    }
                                />
                                <button
                                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                                    onClick={() => handleAddReply(comment.id)}
                                >
                                    Reply
                                </button>
                                {comment.replies.length > 0 && (
                                    <ul className="mt-2 space-y-2 pl-4 border-l border-gray-300">
                                        {comment.replies.map((reply) => (
                                            <li key={reply.id}>
                                                <p>
                                                    <strong>{reply.user.firstName} {reply.user.lastName}:</strong> {reply.content}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <button
                                                        onClick={() => handleVote(reply.id, 'upvote')}
                                                        className="text-green-500 flex items-center gap-1"
                                                        title="Upvote"
                                                    >
                                                        <FaThumbsUp size={16} /> 
                                                        {reply.numUpvotes}
                                                    </button>
                                                    <button
                                                        onClick={() => handleVote(reply.id, 'downvote')}
                                                        className="text-red-500 flex items-center gap-1"
                                                        title="Downvote"
                                                    >
                                                        <FaThumbsDown size={16} /> 
                                                        {reply.numDownvotes}
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No comments yet. Be the first to add a comment!</p>
                )}
            </div>

            <div className="mt-6">
                <textarea
                    className="w-full p-2 border border-gray-300 rounded-md text-black"
                    placeholder="Add a comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                    onClick={handleAddComment}
                >
                    Post My Comment!
                </button>
            </div>
        </div>
    );
};

export default BlogDetails;