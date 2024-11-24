import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaThumbsUp, FaThumbsDown, FaExclamationTriangle } from 'react-icons/fa';

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
        hidden: boolean; // Include hidden field
        numUpvotes: number;
        numDownvotes: number;
        user: { firstName: string; lastName: string; email: string };
        replies: {
            id: number;
            content: string;
            hidden: boolean; // Include hidden field for replies
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
    const isGuest = router.query.guest === 'true';

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

    const handleReportComment = async (commentId: number) => {
        if (!userEmail) {
            setError('Only logged-in users can report comments.');
            return;
        }

        const reason = prompt("Please provide a reason for reporting this comment:");

        if (!reason || reason.trim().length < 3) {
            alert("Reason must be at least 3 characters long.");
            return;
        }

        try {
            const response = await fetch("/api/reporting/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    commentId,
                    reason,
                    userEmail,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || "Failed to report the comment.");
                return;
            }

            alert("Comment reported successfully!");
        } catch (err) {
            console.error("Error reporting comment:", err);
            setError("An unexpected error occurred while reporting the comment.");
        }
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
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
            {error && (
                <div
                    className="fixed top-0 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-8 py-4 shadow-lg rounded-lg z-50 text-lg font-bold flex items-center justify-center w-11/12 max-w-4xl"
                >
                    {error}
                </div>
            )}
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

            <div className="flex gap-4 mt-4">
                <label>
                    <span className="font-semibold text-black">Sort Main Comments:</span>
                    <select
                        className="ml-2 border border-gray-300 rounded-md text-black"
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
                <h3 className="text-lg font-semibold text-black">Comments:</h3>
                {blog.comments.length > 0 ? (
                    <ul className="space-y-4">
                        {blog.comments.map((comment) => (
                            <li key={comment.id} className="border border-gray-300 p-4 rounded-md text-black">
                                <p>
                                    <strong>{comment.user.firstName} {comment.user.lastName}:</strong>{' '}
                                    {comment.hidden ? '[HIDDEN BY ADMIN]' : comment.content}
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
                                    <>
                                        {console.log(userEmail)}
                                        {console.log(comment.user.email)}
                                    </>
                                    {!isAdmin && comment.user.email !== userEmail && (
                                        <button
                                            onClick={() => handleReportComment(comment.id)}
                                            className="text-yellow-500 hover:text-yellow-700"
                                            title="Report Comment"
                                        >
                                            <FaExclamationTriangle size={16} />
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    className="w-full mt-2 p-2 border border-gray-300 rounded-md text-black"
                                    placeholder="Reply to this comment"
                                    value={replyComment[comment.id] || ''}
                                    onChange={(e) =>
                                        setReplyComment((prev) => ({ ...prev, [comment.id]: e.target.value }))
                                    }
                                />
                                <div className="flex items-center mt-2 gap-2">
                                    <button
                                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                                        onClick={() => handleAddReply(comment.id)}
                                    >
                                        Reply
                                    </button>
                                    <label>
                                        <span>Sort Replies:</span>
                                        <select
                                            className="ml-2 border border-gray-300 rounded-md"
                                            value={replySortOptions[comment.id] || 'mostRecent'}
                                            onChange={(e) =>
                                                setReplySortOptions((prev) => ({
                                                    ...prev,
                                                    [comment.id]: e.target.value as 'mostLiked' | 'mostDisliked' | 'mostRecent',
                                                }))
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
                                        {comment.replies.map((reply) => (
                                            <li key={reply.id}>
                                                <p>
                                                    <strong>{reply.user.firstName} {reply.user.lastName}:</strong>{' '}
                                                    {reply.hidden ? '[HIDDEN BY ADMIN]' : reply.content}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <button
                                                        onClick={() => handleVote(reply.id, 'upvote', true, comment.id)}
                                                        className="text-green-500 flex items-center gap-1"
                                                        title="Upvote"
                                                    >
                                                        <FaThumbsUp size={16} />
                                                        {reply.numUpvotes}
                                                    </button>
                                                    <button
                                                        onClick={() => handleVote(reply.id, 'downvote', true, comment.id)}
                                                        className="text-red-500 flex items-center gap-1"
                                                        title="Downvote"
                                                    >
                                                        <FaThumbsDown size={16} />
                                                        {reply.numDownvotes}
                                                    </button>
                                                    {!isAdmin && reply.user.email !== userEmail && (
                                                        <button
                                                            onClick={() => handleReportComment(reply.id)}
                                                            className="text-yellow-500 hover:text-yellow-700"
                                                            title="Report Reply"
                                                        >
                                                            <FaExclamationTriangle size={16} />
                                                        </button>
                                                    )}
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
            <div className="flex justify-between mt-6">
                <button
                    onClick={() => {
                        if (commentsPage > 1) {
                            setCommentsPage((prev) => prev - 1);
                        }
                    }}
                    disabled={commentsPage === 1}
                    className={`px-4 py-2 rounded-md ${
                        commentsPage === 1
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                    Show Less
                </button>
                <button
                    onClick={() => {
                        if (hasMoreComments) {
                            setCommentsPage((prev) => prev + 1);
                        }
                    }}
                    disabled={!hasMoreComments}
                    className={`px-4 py-2 rounded-md ${
                        !hasMoreComments
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                    Show More
                </button>
            </div>
        </div>
    );
};

export default BlogDetails;