import React, { useEffect, useState } from 'react';
import { FaTrash, FaEdit, FaThumbsUp, FaThumbsDown, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface BlogPost {
    id: number;
    title: string;
    description: string;
    tags: string;
    numUpvotes: number;
    numDownvotes: number;
    hidden: boolean;
    user: {
        firstName: string;
        lastName: string;
        email: string;
        id: number;
    };
    createdAt: string;
    templates: {
        id: number;
        title: string;
    }[];
}

const ViewAllBlogs: React.FC = () => {
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState('');
    const [searchField, setSearchField] = useState<'title' | 'description' | 'tags' | 'templates'>('title');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const [deleteNotification, setDeleteNotification] = useState(false);
    const [sortBy, setSortBy] = useState<'mostLiked' | 'mostDisliked' | 'mostRecent'>('mostRecent');
    const [reportSuccess, setReportSuccess] = useState<string | null>(null);
    const router = useRouter();
    const isGuest = router.query.guest === 'true';
    const [templates, setTemplates] = useState<{ id: number; title: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredTemplates, setFilteredTemplates] = useState<{ id: number; title: string }[]>([]);

    useEffect(() => {
        const fetchCurrentUser = async () => {
          if (isGuest) {
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
              console.log('user email:', data.email)
            } else {
              console.error('Failed to fetch user details');
            }
          } catch (err) {
            console.error('Error fetching current user:', err);
          }
        };
    
        fetchCurrentUser();
    }, [isGuest]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const fetchBlogs = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/blogs/sort?sortBy=${sortBy}&page=${page}&limit=${limit}&search=${search}&searchField=${searchField}`);
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Something went wrong while fetching blogs.');
                setLoading(false);
                return;
            }

            const data = await response.json();

            setHasMore(data.length === limit);
            setBlogs(data);
        } catch (err) {
            console.error('Error fetching blogs:', err);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const deleteBlog = async (blogID: number) => {
        if (!userEmail) {
            setError('You need to be logged in to delete blogs.');
            return;
        }
    
        try {
            const response = await fetch(`/api/blogs/delete?blogID=${blogID}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Something went wrong while deleting the blog.');
                return;
            }
    
            const successData = await response.json();
            console.log(successData.message);
    
            setBlogs((prevBlogs) => prevBlogs.filter((blog) => blog.id !== blogID));
            setError(null);
            fetchBlogs();
            setDeleteNotification(true);
            setTimeout(() => setDeleteNotification(false), 3000);
        } catch (err) {
            console.error('Error deleting blog:', err);
            setError('An unexpected error occurred while deleting the blog.');
        }
    };

    const updateBlog = async (updatedBlog: BlogPost) => {
        try {
            const response = await fetch(`/api/blogs/edit?blogID=${updatedBlog.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: updatedBlog.title,
                    description: updatedBlog.description,
                    tags: updatedBlog.tags,
                    templateIds: updatedBlog.templates.map((template) => template.id),
                    userEmail,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setEditError(errorData.error || 'Something went wrong while editing the blog.');
                return;
            }

            const data = await response.json();
            setBlogs((prevBlogs) =>
                prevBlogs.map((blog) => (blog.id === data.id ? { ...blog, ...data } : blog))
            );
            setEditingBlog(null);
            fetchBlogs();
        } catch (err) {
            console.error('Error updating blog:', err);
            setEditError('An unexpected error occurred while editing the blog.');
        }
    };

    useEffect(() => {
        const fetchTemplates = async () => {
          try {
            const response = await fetch('/api/templates');
            if (!response.ok) throw new Error('Failed to fetch templates');
            const data = await response.json();
            setTemplates(data);
            setFilteredTemplates(data);
          } catch (err) {
            console.error('Error fetching templates:', err);
          }
        };
      
        fetchTemplates();
    }, []);

    useEffect(() => {
        setFilteredTemplates(
          templates.filter((template) =>
            template.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
    }, [searchQuery, templates]);

    const handleTemplateSelect = (template: { id: number; title: string }) => {
        if (!editingBlog) {
            console.error("Editing blog is null");
            return;
        }
    
        const isSelected = editingBlog.templates.some((t) => t.id === template.id);
    
        const updatedTemplates = isSelected
            ? editingBlog.templates.filter((t) => t.id !== template.id)
            : [...editingBlog.templates, template];
        
        setEditingBlog((prevBlog) => ({
            ...prevBlog!,
            templates: updatedTemplates,
        }));
    };
      
    const handleVote = async (blogPostId: number, voteType: 'upvote' | 'downvote') => {
        try {
            const response = await fetch(`/api/blogs/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blogPostId, voteType, userEmail }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || `Could not ${voteType} the post.`);
                return;
            }

            const updatedBlogPost = await response.json();
            setBlogs((prevBlogs) =>
                prevBlogs.map((blog) =>
                    blog.id === updatedBlogPost.id
                        ? { ...blog, numUpvotes: updatedBlogPost.numUpvotes, numDownvotes: updatedBlogPost.numDownvotes }
                        : blog
                )
            );
        } catch (err) {
            console.error(`Error during ${voteType}:`, err);
            setError(`An unexpected error occurred while trying to ${voteType}.`);
        }
    };
    const handleReportBlog = async (blogId: number) => {
        if (!userEmail) {
            setError('Only logged-in users can report blog posts.');
            return;
        }
        const reason = prompt("Please provide a reason for reporting this blog:");

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
            body: JSON.stringify({ blogPostId: blogId, reason, userEmail }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.error || "Failed to report the blog.");
            return;
          }

          setReportSuccess("Blog reported successfully!");
          setTimeout(() => setReportSuccess(null), 3000);
        } catch (err) {
          console.error("Error reporting blog:", err);
          setError("An unexpected error occurred while reporting the blog.");
        }
      };

      useEffect(() => {
        const fetchUserInfo = async () => {
          const token = localStorage.getItem("accessToken");
          if (!token) return;

          try {
            const response = await fetch("/api/users/me", {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
              const userData = await response.json();
              setUserEmail(userData.email);
              setIsAdmin(userData.role === "ADMIN");
            }
          } catch (err) {
            console.error("Error fetching user info:", err);
          }
        };

        fetchUserInfo();
        fetchBlogs();
      }, [page, search, sortBy, searchField]);

    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
            {/*ChatGPT code to display the error popup*/}
            {error && (
                <div
                    className="fixed top-0 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-8 py-4 shadow-lg rounded-lg z-50 text-lg font-bold flex items-center justify-center w-11/12 max-w-4xl"
                    style={{
                        animation: 'slideDown 0.5s ease-out',
                    }}
                >
                    {error}
                </div>
            )}
            {reportSuccess && <div className="text-green-500 mb-4">{reportSuccess}</div>}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl text-blue-500 font-semibold">View All Blogs</h1>
                <button
                    onClick={() => {
                        if (!userEmail) {
                            setError('Only logged-in users can create blog posts.');
                            return;
                        }
                        router.push('/blogs/create');
                    }}
                    className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <span className="mr-2 text-lg font-semibold">+</span>
                    Create
                </button>
            </div>
            <div className="mb-4 flex gap-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search blogs..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <select
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value as 'title' | 'description' | 'tags' | 'templates')}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                    <option value="title">By Title</option>
                    <option value="description">By Description</option>
                    <option value="tags">By Tags</option>
                    <option value="templates">By Templates</option>
                </select>
                <button
                    onClick={() => setPage(1)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Search
                </button>
            </div>

            <div className="mb-4 flex justify-between items-center">
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'mostLiked' | 'mostDisliked' | 'mostRecent')}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                    <option value="mostRecent">Most Recent</option>
                    <option value="mostLiked">Most Liked</option>
                    <option value="mostDisliked">Most Disliked</option>
                </select>
            </div>

            {loading ? (
                <p className="text-center">Loading blogs...</p>
            ) : (
                <div>
                    {blogs.length > 0 ? (
                        <div className="space-y-4">
                            {blogs
                            .filter(
                              (blog) =>
                                !blog.hidden || blog.user.email === userEmail || isAdmin // Only show blogs if not hidden, created by user, or admin
                            )
                            .map((blog) => (
                                <div key={blog.id} className="p-4 border border-gray-300 rounded-md relative">
                                    {blog.user.email === userEmail && (
                                        <>
                                        {!blog.hidden && (
                                            <button
                                                onClick={() => setEditingBlog(blog)}
                                                className="absolute top-2 right-12 text-blue-500 hover:text-blue-700"
                                                title="Edit this blog"
                                            >
                                                <FaEdit size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteBlog(blog.id)}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                            title="Delete this blog"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    </>
                                    )}
                                    <h2 className="text-xl font-semibold">
                                        <Link href={isGuest ? `/blogs/${blog.id}?guest=true` : `/blogs/${blog.id}`} 
                                            className="text-blue-700 hover:underline"
                                            >
                                            {blog.title}
                                            {blog.hidden && (
                                                " [HIDDEN BY ADMIN]"
                                            )}
                                        </Link>
                                    </h2>
                                    <p className="text-gray-700">{blog.description}</p>
                                    <p className="text-sm text-gray-500">
                                        Tags: <span className="italic">{blog.tags}</span>
                                    </p>
                                    {blog.templates.length > 0 && (
                                        <div className="mt-4">
                                            <h3 className="text-sm font-semibold text-gray-600">Templates:</h3>
                                            <ul className="list-disc list-inside text-gray-700">
                                                {blog.templates.map((template) => (
                                                    <li key={template.id}>
                                                        <Link href={isGuest ? `/templates/${template.id}?guest=true` : `/templates/${template.id}`}
                                                            className="text-blue-500 hover:underline"
                                                            >
                                                            {template.title}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-500">
                                        By: {blog.user.firstName} {blog.user.lastName} |{' '}
                                        {new Date(blog.createdAt).toLocaleDateString()}
                                    </p>
                                    <div className="flex items-center gap-4 mt-4">
                                        <button
                                            onClick={() => handleVote(blog.id, 'upvote')}
                                            className="text-green-500 flex items-center gap-1"
                                            title="Upvote"
                                        >
                                            <FaThumbsUp size={16} />
                                            {blog.numUpvotes}
                                        </button>
                                        <button
                                            onClick={() => handleVote(blog.id, 'downvote')}
                                            className="text-red-500 flex items-center gap-1"
                                            title="Downvote"
                                        >
                                            <FaThumbsDown size={16} />
                                            {blog.numDownvotes}
                                        </button>
                                        {!isAdmin && blog.user.email !== userEmail && (
                                          <button
                                            onClick={() => handleReportBlog(blog.id)}
                                            className="text-yellow-500 hover:text-yellow-700"
                                            title="Report this blog"
                                          >
                                            <FaExclamationTriangle size={16} />
                                          </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">No blogs found.</p>
                    )}
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
            {editingBlog && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-md max-w-md w-full">
                        <h2 className="text-xl font-semibold text-blue-500 mb-4">Edit Blog</h2>
                        {editError && <div className="text-red-500 mb-4">{editError}</div>}
                        <div className="mb-4">
                            <label className="block font-medium text-gray-700">Edit Title</label>
                            <input
                                type="text"
                                value={editingBlog.title}
                                onChange={(e) =>
                                    setEditingBlog({ ...editingBlog, title: e.target.value })
                                }
                                placeholder="Title"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block font-medium text-gray-700">Edit Description</label>
                            <textarea
                                value={editingBlog.description}
                                onChange={(e) =>
                                    setEditingBlog({ ...editingBlog, description: e.target.value })
                                }
                                placeholder="Description"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block font-medium text-gray-700">Edit Tags</label>
                            <input
                                type="text"
                                value={editingBlog.tags}
                                onChange={(e) =>
                                    setEditingBlog({ ...editingBlog, tags: e.target.value })
                                }
                                placeholder="Tags"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block font-medium text-gray-700">Search Templates</label>
                            <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search templates..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md mb-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                            {filteredTemplates.map((template) => (
                                <div key={template.id} className="flex items-center p-2">
                                <input
                                    type="checkbox"
                                    checked={editingBlog?.templates.some((t) => t.id === template.id) || false}
                                    onChange={() => handleTemplateSelect(template)}
                                    className="mr-2"
                                />
                                <label className="text-black">{template.title}</label>
                                </div>
                            ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setEditingBlog(null)}
                                className="px-4 py-2 bg-gray-300 rounded-md text-black"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => updateBlog(editingBlog)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {deleteNotification && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white py-2 px-4 rounded-md shadow-md transition-opacity duration-300">
                    Blog post deleted!
                </div>
            )}
        </div>
    );
};

export default ViewAllBlogs;