import React, { useEffect, useState } from 'react';

interface BlogPost {
    id: number;
    title: string;
    description: string;
    tags: string;
    user: {
        firstName: string;
        lastName: string;
    };
    createdAt: string;
}

const ViewAllBlogs: React.FC = () => {
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true); // New state to track if more blogs exist

    const fetchBlogs = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/blogs/viewAll?page=${page}&limit=${limit}&search=${search}`);
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Something went wrong while fetching blogs.');
                setLoading(false);
                return;
            }

            const data = await response.json();

            // Update the hasMore state based on the number of blogs fetched
            setHasMore(data.length === limit);

            setBlogs(data);
        } catch (err) {
            console.error('Error fetching blogs:', err);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, [page, search]);

    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
            <h1 className="text-2xl text-blue-500 font-semibold mb-4">View All Blogs</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="mb-4 flex gap-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search blogs by title, description, or tags..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <button
                    onClick={() => setPage(1)} // Reset to page 1 when searching
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Search
                </button>
            </div>
            {loading ? (
                <p className="text-center">Loading blogs...</p>
            ) : (
                <div>
                    {blogs.length > 0 ? (
                        <div className="space-y-4">
                            {blogs.map((blog) => (
                                <div key={blog.id} className="p-4 border border-gray-300 rounded-md">
                                    <h2 className="text-xl font-semibold text-blue-700">{blog.title}</h2>
                                    <p className="text-gray-700">{blog.description}</p>
                                    <p className="text-sm text-gray-500">
                                        Tags: <span className="italic">{blog.tags}</span>
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        By: {blog.user.firstName} {blog.user.lastName} |{' '}
                                        {new Date(blog.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">No blogs found.</p>
                    )}
                    {/* Pagination Controls */}
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            disabled={page === 1}
                            className={`px-4 py-2 rounded-md ${
                                page === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={!hasMore}
                            className={`px-4 py-2 rounded-md ${
                                !hasMore
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewAllBlogs;