import React, { useEffect, useState } from 'react';
import { FaTrash, FaEdit, FaThumbsUp, FaThumbsDown, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '../../components/ThemeToggle';

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
    const [updateNotification, setUpdateNotification] = useState(false);
    const [sortBy, setSortBy] = useState<'mostLiked' | 'mostDisliked' | 'mostRecent'>('mostRecent');
    const [reportSuccess, setReportSuccess] = useState<string | null>(null);
    const router = useRouter();
    const isGuest = router.query.guest === 'true';
    const [templates, setTemplates] = useState<{ id: number; title: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredTemplates, setFilteredTemplates] = useState<{ id: number; title: string }[]>([]);
    const { theme } = useTheme(); // Add theme from useTheme
    const [reportModal, setReportModal] = useState<{ isOpen: boolean; blogId: number | null }>({
      isOpen: false,
      blogId: null,
    });
    const [reportReason, setReportReason] = useState<string>('');

    const handleOpenReportModal = (blogId: number) => {
      setReportModal({ isOpen: true, blogId });
    };

    const handleCloseReportModal = () => {
        setReportModal({ isOpen: false, blogId: null });
        setReportReason('');
    };

    useEffect(() => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
          router.push('/blogs/viewAll?guest=true');
      }
    }, []);

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
            const validatedTags = validateTags(updatedBlog.tags);
            const response = await fetch(`/api/blogs/edit?blogID=${updatedBlog.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: updatedBlog.title,
                    description: updatedBlog.description,
                    tags: validatedTags,
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
            setUpdateNotification(true);
            setTimeout(() => setUpdateNotification(false), 3000);
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

    const validateTags = (tags: string): string => {
        const formattedTags = tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag !== '');
    
        return formattedTags.join(',');
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawTags = e.target.value;
      setEditingBlog((prevBlog) =>
          prevBlog ? { ...prevBlog, tags: rawTags } : null
      );
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
    const handleSubmitReport = async () => {
        if (!reportReason || reportReason.trim().length < 3) {
            setError('Reason must be at least 3 characters long.');
            return;
        }
    
        if (reportModal.blogId === null) return;
    
        try {
            const response = await fetch("/api/reporting/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ blogPostId: reportModal.blogId, reason: reportReason.trim(), userEmail }),
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
        } finally {
            handleCloseReportModal();
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
        <div
          className={`max-w-4xl mx-auto mt-10 p-6 rounded-md shadow-md ${
            theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
          }`}
        >
          {error && (
            <div
              className={`fixed top-4 left-1/2 transform -translate-x-1/2 p-4 rounded-md shadow-lg ${
                theme === 'dark' ? 'bg-red-800 text-white' : 'bg-red-100 text-red-600'
              }`}
            >
              {error}
            </div>
          )}
          {reportSuccess && (
            <div
              className={`fixed top-4 left-1/2 transform -translate-x-1/2 p-4 rounded-md shadow-lg ${
                theme === 'dark' ? 'bg-green-800 text-green-400' : 'bg-green-100 text-green-600'
              }`}
            >
              {reportSuccess}
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h1
              className={`text-3xl font-bold ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
              }`}
            >
              View All Blogs
            </h1>
            <button
              onClick={() => {
                if (!userEmail) {
                  setError('Only logged-in users can create blog posts.');
                  return;
                }
                router.push('/blogs/create');
              }}
              className={`px-4 py-2 rounded-md transition ${
                theme === 'dark'
                  ? 'bg-green-500 text-white hover:bg-green-400'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              + Create Blog
            </button>
          </div>
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blogs..."
              className={`flex-grow px-4 py-2 rounded-md border focus:outline-none focus:ring-2 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                  : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
              }`}
            />
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as 'title' | 'description' | 'tags' | 'templates')}
              className={`px-4 py-2 rounded-md border focus:outline-none focus:ring-2 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                  : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
              }`}
            >
              <option value="title">By Title</option>
              <option value="description">By Description</option>
              <option value="tags">By Tags</option>
              <option value="templates">By Templates</option>
            </select>
          </div>
          <div className="flex justify-between items-center mb-6">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'mostLiked' | 'mostDisliked' | 'mostRecent')}
              className={`px-4 py-2 rounded-md border focus:outline-none focus:ring-2 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                  : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
              }`}
            >
              <option value="mostRecent">Most Recent</option>
              <option value="mostLiked">Most Liked</option>
              <option value="mostDisliked">Most Disliked</option>
            </select>
          </div>
          {loading ? (
            <p className="text-center">Loading blogs...</p>
          ) : blogs.length > 0 ? (
            <div className="space-y-4">
              {blogs
                .filter((blog) => !blog.hidden || blog.user.email === userEmail || isAdmin)
                .map((blog) => (
                  <div
                    key={blog.id}
                    className={`relative p-4 rounded-md shadow-md border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-200'
                        : 'bg-gray-50 border-gray-300 text-gray-800'
                    }`}
                  >
                    <h2
                        className={`text-2xl font-semibold break-words pr-12 ${
                          theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
                        }`}
                      >
                      <Link
                        href={isGuest ? `/blogs/${blog.id}?guest=true` : `/blogs/${blog.id}`}
                        className={`text-2xl font-semibold hover:underline ${
                          theme === 'dark' ? 'text-blue-300' : 'text-blue-500'
                        }`}
                      >
                        {blog.title}
                      </Link>
                      {blog.hidden && <span className="ml-2 text-red-500">(Hidden)</span>}
                    </h2>
      
                    {/* Edit and Delete Buttons */}
                    {blog.user.email === userEmail && (
                      <div className="absolute top-4 right-4 flex gap-2">
                        {!blog.hidden && (
                          <button
                            onClick={() => setEditingBlog(blog)}
                            className={`flex items-center gap-1 ${
                              theme === 'dark'
                                ? 'text-blue-300 hover:text-blue-400'
                                : 'text-blue-500 hover:text-blue-700'
                            }`}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                        )}
                        <button
                          onClick={() => deleteBlog(blog.id)}
                          className={`flex items-center gap-1 ${
                            theme === 'dark'
                              ? 'text-red-400 hover:text-red-500'
                              : 'text-red-500 hover:text-red-700'
                          }`}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
      
                    <p className="text-sm text-gray-400">
                      By: {blog.user.firstName} {blog.user.lastName} |{' '}
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-base mt-2">Description: {blog.description}</p>
                    <p className="text-sm text-gray-400">
                      Tags: <span className="italic">{blog.tags}</span>
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                      <button
                        onClick={() => handleVote(blog.id, 'upvote')}
                        className={`flex items-center gap-1 ${
                          theme === 'dark'
                            ? 'text-green-400 hover:text-green-500'
                            : 'text-green-500 hover:text-green-600'
                        }`}
                      >
                        <FaThumbsUp /> {blog.numUpvotes}
                      </button>
                      <button
                        onClick={() => handleVote(blog.id, 'downvote')}
                        className={`flex items-center gap-1 ${
                          theme === 'dark'
                            ? 'text-red-400 hover:text-red-500'
                            : 'text-red-500 hover:text-red-600'
                        }`}
                      >
                        <FaThumbsDown /> {blog.numDownvotes}
                      </button>
                      {!isAdmin && blog.user.email !== userEmail && (
                        <button
                          onClick={() => handleOpenReportModal(blog.id)}
                          className={`flex items-center gap-1 ${
                              theme === 'dark' ? 'text-yellow-400 hover:text-yellow-500' : 'text-yellow-500 hover:text-yellow-600'
                          }`}
                        >
                          <FaExclamationTriangle />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center">No blogs found.</p>
          )}
          {reportModal.isOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
                <div
                    className={`p-6 rounded-lg shadow-lg w-full max-w-md ${
                        theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'
                    }`}
                >
                    <h2 className="text-2xl font-bold mb-4">Report Blog</h2>
                    <textarea
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="Provide a reason for reporting this blog..."
                        className={`w-full p-4 rounded-md border focus:ring-2 ${
                            theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                                : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
                        }`}
                        rows={4}
                    />
                    <div className="flex justify-end mt-4 space-x-4">
                        <button
                            onClick={handleCloseReportModal}
                            className={`px-4 py-2 rounded-md ${
                                theme === 'dark'
                                    ? 'bg-gray-600 text-white hover:bg-gray-500'
                                    : 'bg-gray-300 text-black hover:bg-gray-400'
                            }`}
                        >
                            Cancel
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md ${
                                reportReason.trim().length < 3
                                    ? 'bg-blue-300 text-white cursor-not-allowed'
                                    : theme === 'dark'
                                    ? 'bg-blue-500 text-white hover:bg-blue-400'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                            onClick={handleSubmitReport}
                            disabled={reportReason.trim().length < 3}
                        >
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </div>
            </div>
        )}

            
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-md ${
                page === 1
                  ? 'bg-gray-300 cursor-not-allowed'
                  : theme === 'dark'
                  ? 'bg-blue-500 hover:bg-blue-400 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
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
                  : theme === 'dark'
                  ? 'bg-blue-500 hover:bg-blue-400 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Next
            </button>
        </div>
            {editingBlog && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center">
                    <div
                        className={`p-8 rounded-md max-w-2xl w-full ${
                            theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'
                        }`}
                    >
                        <h2
                            className={`text-2xl font-bold mb-6 ${
                                theme === 'dark' ? 'text-blue-300' : 'text-blue-500'
                            }`}
                        >
                            Edit Blog
                        </h2>
                        <div className="space-y-4">
                            {editError && (
                                <div
                                    className={`p-2 rounded-md ${
                                        theme === 'dark' ? 'bg-red-800 text-red-400' : 'bg-red-100 text-red-600'
                                    }`}
                                >
                                    {editError}
                                </div>
                            )}
                            <div>
                                <label
                                    className={`block font-semibold mb-1 ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}
                                >
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={editingBlog.title}
                                    onChange={(e) =>
                                        setEditingBlog({ ...editingBlog, title: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                                            : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
                                    }`}
                                />
                            </div>
                            <div>
                                <label
                                    className={`block font-semibold mb-1 ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}
                                >
                                    Description
                                </label>
                                <textarea
                                    value={editingBlog.description}
                                    onChange={(e) =>
                                        setEditingBlog({ ...editingBlog, description: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                                            : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
                                    }`}
                                    rows={4}
                                />
                            </div>
                            <div>
                                <label
                                    className={`block font-semibold mb-1 ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}
                                >
                                    Tags (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={editingBlog?.tags || ''}
                                    onChange={handleTagsChange}
                                    placeholder="e.g., tag1,tag2,tag3"
                                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                                            : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
                                    }`}
                                />
                            </div>
                            <div>
                                <label
                                    className={`block font-semibold mb-1 ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}
                                >
                                    Search Templates
                                </label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                                            : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
                                    }`}
                                    placeholder="Search templates..."
                                />
                                <div
                                    className={`max-h-40 overflow-y-auto border rounded-md ${
                                        theme === 'dark'
                                            ? 'border-gray-600 bg-gray-700'
                                            : 'border-gray-300 bg-gray-50'
                                    }`}
                                >
                                    {filteredTemplates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="flex items-center p-2"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={editingBlog?.templates.some((t) => t.id === template.id) || false}
                                                onChange={() => handleTemplateSelect(template)}
                                                className="mr-2"
                                            />
                                            <label
                                                className={`${
                                                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                                                }`}
                                            >
                                                {template.title}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                onClick={() => setEditingBlog(null)}
                                className={`px-6 py-2 rounded-md ${
                                    theme === 'dark'
                                        ? 'bg-gray-600 text-white hover:bg-gray-500'
                                        : 'bg-gray-300 text-black hover:bg-gray-400'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => updateBlog(editingBlog)}
                                className={`px-6 py-2 rounded-md ${
                                    theme === 'dark'
                                        ? 'bg-blue-500 text-white hover:bg-blue-400'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
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
            {updateNotification && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white py-2 px-4 rounded-md shadow-md transition-opacity duration-300">
                    Blog Updated!
                </div>
            )}
        </div>
    );
};

export default ViewAllBlogs;