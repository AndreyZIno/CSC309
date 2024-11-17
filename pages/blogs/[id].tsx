import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

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
            {blog.comments.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold">Comments:</h3>
                    <ul className="space-y-4">
                        {blog.comments.map((comment) => (
                            <li key={comment.id}>
                                <p>
                                    <strong>{comment.user.firstName} {comment.user.lastName}:</strong> {comment.content}
                                </p>
                                {comment.replies.length > 0 && (
                                    <ul className="ml-4 list-disc">
                                        {comment.replies.map((reply) => (
                                            <li key={reply.id}>
                                                <p>
                                                    <strong>{reply.user.firstName} {reply.user.lastName}:</strong> {reply.content}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BlogDetails;
