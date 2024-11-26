import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaThumbsUp, FaThumbsDown, FaExclamationTriangle } from 'react-icons/fa';
import { useTheme } from '../../components/ThemeToggle';

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
        hidden: boolean;
        numUpvotes: number;
        numDownvotes: number;
        user: { firstName: string; lastName: string; email: string };
        replies: {
            id: number;
            content: string;
            hidden: boolean;
            numUpvotes: number;
            numDownvotes: number;
            user: { firstName: string; lastName: string; email: string };
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
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [sortByMain, setSortByMain] = useState<'mostLiked' | 'mostDisliked' | 'mostRecent'>('mostLiked');
    const [replySortOptions, setReplySortOptions] = useState<{ [key: number]: 'mostLiked' | 'mostDisliked' | 'mostRecent' }>({});
    const [commentsPage, setCommentsPage] = useState(1);
    const [commentsLimit] = useState(5);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    const [replyPages, setReplyPages] = useState<{ [key: number]: number }>({});
    const [replyLimits] = useState(3);
    const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
    const [reportReason, setReportReason] = useState('');
    const isGuest = router.query.guest === 'true';
    const { theme } = useTheme();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const token = localStorage.getItem('accessToken');
            console.log('token:', token)
            if (isGuest || !token) {
                setUserEmail(null);
                return;
            }

            try {
            const response = await fetch('/api/users/me', {
                method: 'GET',
                headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUserEmail(data.email);
                setIsAdmin(data.role === "ADMIN");
            } else {
                console.error('Failed to fetch user details');
            }
            } catch (err) {
            console.error('Error fetching current user:', err);
            }
        };

        fetchCurrentUser();
      }, [isGuest]);

    const fetchBlog = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);

        try {
            const sortByRepliesParam = Object.keys(replySortOptions).length
            ? Object.values(replySortOptions).join(',')
            : 'mostRecent';
    
            const response = await fetch(
                `/api/blogs/${id}?page=${commentsPage}&limit=${commentsLimit}&sortByMain=${sortByMain}&sortByReplies=${sortByRepliesParam}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch the blog post.');
                return;
            }

            const data = await response.json();
            if (commentsPage === 1) {
                setBlog(data);
            } 
            else {
                setBlog((prevBlog) =>
                    prevBlog
                        ? {
                              ...prevBlog,
                              comments: [...prevBlog.comments, ...data.comments],
                          }
                        : data
                );
            }
            setHasMoreComments(data.comments.length === commentsLimit);
        } catch (err) {
            console.error('Error fetching blog:', err);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };
    const handleReplySortChange = async (commentId: number, sortOption: 'mostLiked' | 'mostDisliked' | 'mostRecent') => {
        try {
            const response = await fetch(
                `/api/blogs/${id}?sortByMain=${sortByMain}&sortByReplies=${sortOption}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Could not sort replies.');
                return;
            }

            const updatedBlog = await response.json();

            setBlog(updatedBlog);
            setReplySortOptions((prevOptions) => ({ ...prevOptions, [commentId]: sortOption }));
        } catch (err) {
            console.error('Error sorting replies:', err);
            setError('An unexpected error occurred while sorting replies.');
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
                    userEmail: userEmail,
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || `Could not add comment.`);
                return;
            }
    
            const newCommentData = await response.json();
            setBlog((prevBlog) => {
                if (!prevBlog) return prevBlog;
    
                return {
                    ...prevBlog,
                    comments: [
                        ...prevBlog.comments,
                        {
                            id: newCommentData.id,
                            content: newCommentData.content,
                            numUpvotes: 0,
                            numDownvotes: 0,
                            hidden: newCommentData.hidden,
                            user: {
                                firstName: newCommentData.user.firstName,
                                lastName: newCommentData.user.lastName,
                                email: newCommentData.user.email, // email
                            },
                            replies: [],
                        },
                    ],
                };
            });
            setNewComment('');
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
                    userEmail: userEmail,
                    parentId,
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || `Could not add reply.`);
                return;
            }
    
            const newReplyData = await response.json();
    
            setBlog((prevBlog) => {
                if (!prevBlog) return prevBlog;
    
                const updatedComments = prevBlog.comments.map((comment) => {
                    if (comment.id === parentId) {
                        return {
                            ...comment,
                            replies: [
                                ...comment.replies,
                                {
                                    id: newReplyData.id,
                                    content: newReplyData.content,
                                    hidden: newReplyData.hidden,
                                    numUpvotes: 0,
                                    numDownvotes: 0,
                                    user: {
                                        firstName: newReplyData.user.firstName,
                                        lastName: newReplyData.user.lastName,
                                        email: newReplyData.user.email, // email
                                    },
                                },
                            ],
                        };
                    }
                    return comment;
                });
    
                return { ...prevBlog, comments: updatedComments };
            });
    
            setReplyComment((prev) => ({ ...prev, [parentId]: '' }));
        } catch (err) {
            console.error(err);
            setError('Could not add the reply.');
        }
    };

    const handleVote = async (commentId: number, voteType: 'upvote' | 'downvote', isReply = false, parentId?: number) => {
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

            const updatedVoteData = await response.json();

            setBlog((prevBlog) => { // prevBlog: curr state value of blog (before update)
                if (!prevBlog) return prevBlog;
                    const updatedComments = prevBlog.comments.map((comment) => {
                        // ChatGPT code: >>
                        if (comment.id === commentId && !isReply) {
                            return {
                                ...comment,
                                numUpvotes: updatedVoteData.numUpvotes,
                                numDownvotes: updatedVoteData.numDownvotes,
                            };
                        }
                        if (isReply && comment.id === parentId) {
                            const updatedReplies = comment.replies.map((reply) =>
                                reply.id === commentId
                                    ? {
                                        ...reply,
                                        numUpvotes: updatedVoteData.numUpvotes,
                                        numDownvotes: updatedVoteData.numDownvotes,
                                    }
                                    : reply
                            );
                            return {
                                ...comment,
                                replies: updatedReplies,
                            };
                        }
                        return comment;
                    });

                    return { ...prevBlog, comments: updatedComments };  //<< until here
                    //used to just have a fetchBlogs();, but that made the screen flicker
            });
        } catch (err) {
            console.error('Error voting on comment:', err);
            setError('Could not vote on the comment.');
        }
    };

    const handleReportComment = (commentId: number) => {
        setReportingCommentId(commentId);
    };

    const submitReport = async () => {
        if (!reportReason.trim() || reportReason.length < 3) {
            setError('Reason must be at least 3 characters long.');
            return;
        }

        try {
            const response = await fetch('/api/reporting/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId: reportingCommentId, reason: reportReason, userEmail }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to report the comment.');
                return;
            }

            setReportingCommentId(null);
            setReportReason('');
            alert('Comment reported successfully!');
        } catch (err) {
            console.error('Error reporting comment:', err);
            setError('An unexpected error occurred while reporting the comment.');
        }
    };

    const toggleReplyPage = (commentId: number, increment: boolean) => {
        setReplyPages((prev) => ({
            ...prev,
            [commentId]: Math.max(1, (prev[commentId] || 1) + (increment ? 1 : -1)),
        }));
    };

    useEffect(() => {
        fetchBlog();
    }, [id, sortByMain, commentsPage]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    if (loading) {
        return <p className="text-center">Loading...</p>;
    }

    if (!blog) {
        return null;
    }

    return (
        <div
            className={`max-w-4xl mx-auto mt-10 p-6 rounded-md shadow-md ${
                theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
            }`}
        >
            {error && (
                <div
                    className={`fixed top-4 left-1/2 transform -translate-x-1/2 p-4 rounded-md shadow-lg ${
                        theme === 'dark' ? 'bg-red-800 text-red-400' : 'bg-red-100 text-red-600'
                    }`}
                >
                    {error}
                </div>
            )}
            <h1
                className={`text-3xl font-semibold ${
                    theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
                }`}
            >
                {blog.title}
            </h1>
            <p className="text-sm">
                By {blog.user.firstName} {blog.user.lastName} |{' '}
                {new Date(blog.createdAt).toLocaleDateString()}
            </p>
            <p className="text-base mt-4">
                Description: {blog.description}
            </p>
            <p className="text-sm mt-4">
                Tags: <span className="italic">{blog.tags}</span>
            </p>

            <div className="mt-4 flex items-center gap-4">
                <p
                    className={`font-semibold ${
                        theme === 'dark' ? 'text-green-400' : 'text-green-500'
                    }`}
                >
                    Upvotes: {blog.numUpvotes}
                </p>
                <p
                    className={`font-semibold ${
                        theme === 'dark' ? 'text-red-400' : 'text-red-500'
                    }`}
                >
                    Downvotes: {blog.numDownvotes}
                </p>
            </div>

            {blog.templates.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold">Templates:</h3>
                    <ul className="list-disc list-inside">
                        {blog.templates.map((template) => (
                            <li key={template.id}>
                                <Link
                                    href={`/templates/${template.id}`}
                                    className={`hover:underline ${
                                        theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
                                    }`}
                                >
                                    {template.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex gap-4 mt-4">
                <label>
                    <span className="font-semibold">Sort Main Comments:</span>
                    <select
                        className={`ml-2 border rounded-md focus:outline-none ${
                            theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-gray-200'
                                : 'bg-gray-50 border-gray-300 text-gray-800'
                        }`}
                        value={sortByMain}
                        onChange={(e) => setSortByMain(e.target.value as 'mostLiked' | 'mostDisliked' | 'mostRecent')}
                    >
                        <option value="mostLiked">Most Liked</option>
                        <option value="mostDisliked">Most Disliked</option>
                        <option value="mostRecent">Most Recent</option>
                    </select>
                </label>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-semibold">Comments:</h3>
                {blog.comments.length > 0 ? (
                    <ul className="space-y-4">
                        {blog.comments.slice(0, commentsPage * commentsLimit).map((comment) => (
                            <li
                                key={comment.id}
                                className={`p-4 rounded-md shadow-md ${
                                    theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600'
                                        : 'bg-gray-50 border-gray-300'
                                }`}
                            >
                                <p>
                                    <strong>
                                        {comment.user.firstName} {comment.user.lastName}:
                                    </strong>{' '}
                                    {comment.hidden && comment.user.email !== userEmail && !isAdmin ? (
                                        <span className="text-red-500">(Hidden)</span>
                                    ) : (
                                        <>
                                            {comment.content}{' '}
                                            {comment.hidden && (
                                                <span className="text-red-500">(Hidden)</span>
                                            )}
                                        </>
                                    )}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                    <button
                                        onClick={() => handleVote(comment.id, 'upvote')}
                                        className={`flex items-center gap-1 ${
                                            theme === 'dark'
                                                ? 'text-green-400 hover:text-green-500'
                                                : 'text-green-500 hover:text-green-600'
                                        }`}
                                    >
                                        <FaThumbsUp size={16} />
                                        {comment.numUpvotes}
                                    </button>
                                    <button
                                        onClick={() => handleVote(comment.id, 'downvote')}
                                        className={`flex items-center gap-1 ${
                                            theme === 'dark'
                                                ? 'text-red-400 hover:text-red-500'
                                                : 'text-red-500 hover:text-red-600'
                                        }`}
                                    >
                                        <FaThumbsDown size={16} />
                                        {comment.numDownvotes}
                                    </button>
                                    {!isAdmin && comment.user.email !== userEmail && !comment.hidden && (
                                        <button
                                            onClick={() => handleReportComment(comment.id)}
                                            className={`hover:text-yellow-700 ${
                                                theme === 'dark'
                                                    ? 'text-yellow-400'
                                                    : 'text-yellow-500'
                                            }`}
                                        >
                                            <FaExclamationTriangle size={16} />
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    className={`w-full mt-2 p-2 border rounded-md ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-gray-200'
                                            : 'bg-gray-50 border-gray-300 text-gray-800'
                                    }`}
                                    placeholder="Reply to this comment"
                                    value={replyComment[comment.id] || ''}
                                    onChange={(e) =>
                                        setReplyComment((prev) => ({
                                            ...prev,
                                            [comment.id]: e.target.value,
                                        }))
                                    }
                                />
                                <div className="flex items-center mt-2 gap-2">
                                    <button
                                        className={`mt-2 px-4 py-2 rounded-md ${
                                            theme === 'dark'
                                                ? 'bg-blue-500 text-white hover:bg-blue-400'
                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                        }`}
                                        onClick={() => handleAddReply(comment.id)}
                                    >
                                        Reply
                                    </button>
                                    <label>
                                        <span>Sort Replies:</span>
                                        <select
                                            className={`ml-2 border rounded-md focus:outline-none ${
                                                theme === 'dark'
                                                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                                                    : 'bg-gray-50 border-gray-300 text-gray-800'
                                            }`}
                                            value={replySortOptions[comment.id] || 'mostRecent'}
                                            onChange={(e) =>
                                                handleReplySortChange(
                                                    comment.id,
                                                    e.target.value as
                                                        | 'mostLiked'
                                                        | 'mostDisliked'
                                                        | 'mostRecent'
                                                )
                                            }
                                        >
                                            <option value="mostLiked">Most Liked</option>
                                            <option value="mostDisliked">Most Disliked</option>
                                            <option value="mostRecent">Most Recent</option>
                                        </select>
                                    </label>
                                </div>
                                {comment.replies.length > 0 && (
                                    <ul className="mt-2 space-y-2 pl-4 border-l border-gray-300">
                                        {comment.replies
                                            .slice(
                                                0,
                                                replyPages[comment.id] * replyLimits || replyLimits
                                            )
                                            .map((reply) => (
                                                <li key={reply.id}>
                                                    <p>
                                                        <strong>
                                                            {reply.user.firstName}{' '}
                                                            {reply.user.lastName}:
                                                        </strong>{' '}
                                                        {reply.hidden &&
                                                        reply.user.email !== userEmail &&
                                                        !isAdmin ? (
                                                            <span className="text-red-500">
                                                                (Hidden)
                                                            </span>
                                                        ) : (
                                                            <>
                                                                {reply.content}{' '}
                                                                {reply.hidden && (
                                                                    <span className="text-red-500">
                                                                        (Hidden)
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <button
                                                            onClick={() =>
                                                                handleVote(
                                                                    reply.id,
                                                                    'upvote',
                                                                    true,
                                                                    comment.id
                                                                )
                                                            }
                                                            className="text-green-500 flex items-center gap-1"
                                                            title="Upvote"
                                                        >
                                                            <FaThumbsUp size={16} />
                                                            {reply.numUpvotes}
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleVote(
                                                                    reply.id,
                                                                    'downvote',
                                                                    true,
                                                                    comment.id
                                                                )
                                                            }
                                                            className="text-red-500 flex items-center gap-1"
                                                            title="Downvote"
                                                        >
                                                            <FaThumbsDown size={16} />
                                                            {reply.numDownvotes}
                                                        </button>
                                                        {!isAdmin &&
                                                            reply.user.email !== userEmail &&
                                                            !reply.hidden && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleReportComment(
                                                                            reply.id
                                                                        )
                                                                    }
                                                                    className="text-yellow-500 hover:text-yellow-700"
                                                                    title="Report Reply"
                                                                >
                                                                    <FaExclamationTriangle
                                                                        size={16}
                                                                    />
                                                                </button>
                                                            )}
                                                    </div>
                                                </li>
                                            ))}
                                        <div className="flex justify-start gap-4 mt-4">
                                            {comment.replies.length >
                                                (replyPages[comment.id] || 1) * replyLimits && (
                                                <button
                                                    className="text-blue-500 hover:text-blue-600"
                                                    onClick={() => toggleReplyPage(comment.id, true)}
                                                >
                                                    Show More Replies
                                                </button>
                                            )}
                                            {replyPages[comment.id] > 1 && (
                                                <button
                                                    className="text-blue-500 hover:text-blue-600"
                                                    onClick={() => toggleReplyPage(comment.id, false)}
                                                >
                                                    Show Less Replies
                                                </button>
                                            )}
                                        </div>
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No comments yet. Be the first to add a comment!</p>
                )}
            </div>

            <div className="mt-6">
                <textarea
                    className={`w-full p-2 rounded-md border ${
                        theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-gray-200'
                            : 'bg-gray-50 border-gray-300 text-gray-800'
                    }`}
                    placeholder="Add a comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                    className={`mt-2 px-4 py-2 rounded-md ${
                        theme === 'dark'
                            ? 'bg-blue-500 text-white hover:bg-blue-400'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    onClick={handleAddComment}
                >
                    Post My Comment!
                </button>
            </div>

            {reportingCommentId && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-md w-80">
                        <h3 className="text-lg font-bold text-gray-700">Report Comment</h3>
                        <textarea
                            className="w-full mt-2 p-2 border border-gray-300 rounded-md text-black"
                            placeholder="Enter reason for reporting"
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                        />
                        <div className="flex justify-end mt-4 gap-2">
                            <button
                                className="bg-gray-300 px-4 py-2 rounded-md"
                                onClick={() => setReportingCommentId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                                onClick={submitReport}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between mt-6">
                {commentsPage > 1 && (
                    <button
                        className="text-blue-500 hover:text-blue-600"
                        onClick={() => setCommentsPage((prev) => prev - 1)}
                    >
                        Show Less Comments
                    </button>
                )}
                {hasMoreComments && (
                    <button
                        className="text-blue-500 hover:text-blue-600"
                        onClick={() => setCommentsPage((prev) => prev + 1)}
                    >
                        Show More Comments
                    </button>
                )}
            </div>
        </div>
    );
};

export default BlogDetails;