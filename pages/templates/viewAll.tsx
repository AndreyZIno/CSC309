import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '../../components/ThemeToggle';

interface Template {
    id: number;
    title: string;
    explanation: string;
    tags: string[];
    code: string;
    language: string;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
    forked: boolean;
    blogs: BlogPost[];
}

interface BlogPost {
    id: number;
    title: string;
    description: string;
    tags: string;
    createdAt: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

const ViewAllTemplates: React.FC = () => {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [search, setSearch] = useState('');
    const [searchField, setSearchField] = useState<'title' | 'tags' | 'explanation'>('title'); // Added
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [hasMore, setHasMore] = useState(true);
    const [deleteNotification, setDeleteNotification] = useState(false);
    const [updateNotification, setUpdateNotification] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [filter, setFilter] = useState<'all' | 'own'>('all'); // Added for filtering
    const isGuest = router.query.guest === 'true';
    const { theme } = useTheme();

    // Fetch current user ID
    useEffect(() => {
        const fetchCurrentUser = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            try {
                const response = await fetch('/api/users/me', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setCurrentUserId(data.id);
                }
            } catch (err) {
                console.error('Error fetching current user:', err);
            }
        };
        fetchCurrentUser();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');

        try {
            // const token = localStorage.getItem('accessToken');
            
            const endpoint =
                filter === 'own'
                    ? `/api/templates/viewOwn?page=${page}&limit=${limit}&search=${search}&searchField=${searchField}`
                    : `/api/templates/viewAll?page=${page}&limit=${limit}&search=${search}&searchField=${searchField}`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })
             
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Something went wrong while fetching templates.');
                return;
            }

            const data = await response.json();

            if (filter === 'own') {
                setHasMore(data.templates.length === limit);
                setTemplates(data.templates);
            } else {
                console.log(data.length)
                setHasMore(data.length === limit);
                setTemplates(data);
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [page, search, filter]);

    const handleDeleteTemplate = async (templateId: number) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('You need to be logged in to delete templates.');
            return;
        }

        try {
            const response = await fetch(`/api/templates/delete?templateID=${templateId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setTemplates((prevTemplates) => prevTemplates.filter((template) => template.id !== templateId));
                setDeleteNotification(true);
                setTimeout(() => setDeleteNotification(false), 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete template.');
            }
        } catch (err) {
            console.error('Error during delete operation:', err);
            setError('An unexpected error occurred while deleting the template.');
        }
    };

    const handleUpdateTemplate = async (updatedTemplate: Template) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('You need to be logged in to edit templates.');
            return;
        }

        try {
            const response = await fetch(`/api/templates/edit`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    templateId: updatedTemplate.id,
                    title: updatedTemplate.title,
                    explanation: updatedTemplate.explanation,
                    code: updatedTemplate.code,
                    tags: updatedTemplate.tags,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setTemplates((prevTemplates) =>
                    prevTemplates.map((template) =>
                        template.id === data.updatedTemplate.id ? { ...template, ...data.updatedTemplate } : template
                    )
                );
                setEditingTemplate(null);
                setUpdateNotification(true);
                setTimeout(() => setUpdateNotification(false), 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to update template.');
            }
        } catch (err) {
            console.error('Error during update operation:', err);
            setError('An unexpected error occurred while updating the template.');
        }
    };

    return (
        <div
            className={`max-w-4xl mx-auto mt-10 p-6 rounded-lg shadow-md ${
                theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
            }`}
        >
            <div className="flex justify-between items-center mb-6">
                <h1
                    className={`text-3xl font-bold ${
                        theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
                    }`}
                >
                    View Templates
                </h1>
                <button
                    onClick={() => {
                        if (isGuest) {
                            setError('Only logged-in users can create templates.');
                            return;
                        }
                        router.push('/templates/create');
                    }}
                    className={`mb-4 px-4 py-2 rounded-md ${
                        theme === 'dark'
                            ? 'bg-green-500 text-white hover:bg-green-400'
                            : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                    + Create Template
                </button>
            </div>
    
            {error && (
                <div
                    className={`p-4 mb-4 rounded-lg ${
                        theme === 'dark' ? 'bg-red-800 text-red-400' : 'bg-red-100 text-red-500'
                    }`}
                >
                    {error}
                </div>
            )}
            <div className="mb-4 flex gap-4">

                <select
                    value={filter}
                    onChange={(e) => {
                        setFilter(e.target.value as 'all' | 'own');
                        setPage(1);
                    }}
                    className={`px-4 py-2 border rounded-md focus:ring-2 ${
                        theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                            : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
                    }`}
                >
                    <option value="all">All Templates</option>
                    <option value="own">My Templates</option>
                </select>
            </div>

            <div className="mb-4 flex gap-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search templates..."
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 ${
                        theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                            : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
                    }`}
                />
                <select
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value as 'title' | 'tags' | 'explanation')}
                    className={`px-4 py-2 border rounded-md focus:ring-2 ${
                        theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                            : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
                    }`}
                >
                    <option value="title">Search by Title</option>
                    <option value="tags">Search by Tags</option>
                    <option value="explanation">Search by Explanation</option>
                </select>
            </div>
    
            {loading ? (
                <p className="text-center">Loading templates...</p>
            ) : (
                <div>
                    {templates.length > 0 ? (
                        <div className="space-y-4">
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    className={`relative p-4 border rounded-md ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-gray-200'
                                            : 'bg-gray-50 border-gray-300 text-gray-800'
                                    }`}
                                >
                                    {/* Title and Edit/Delete Buttons */}
                                    <div className="flex justify-between items-center">
                                        <Link
                                            href={
                                                isGuest
                                                    ? `/templates/${template.id}?guest=true`
                                                    : `/templates/${template.id}`
                                            }
                                            className={`text-3xl font-semibold hover:underline ${
                                                theme === 'dark' ? 'text-blue-300' : 'text-blue-500'
                                            }`}
                                        >
                                            {template.title}
                                        </Link>
                                        {currentUserId === template.user.id && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingTemplate(template)}
                                                    className={`flex items-center gap-1 ${
                                                        theme === 'dark'
                                                            ? 'text-blue-300 hover:text-blue-400'
                                                            : 'text-blue-500 hover:text-blue-700'
                                                    }`}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                    className={`flex items-center gap-1 ${
                                                        theme === 'dark'
                                                            ? 'text-red-400 hover:text-red-500'
                                                            : 'text-red-500 hover:text-red-700'
                                                    }`}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        )}
                                    </div>
    
                                    <p className="text-md mt-2">Description: {template.explanation}</p>
                                    <p className="text-sm text-gray-400">Language: {template.language}</p>
                                    <p className="text-sm text-gray-400">
                                        Tags: <span className="italic">{template.tags}</span>
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        By: {template.user.firstName} {template.user.lastName}
                                    </p>
    
                                    {/* Associated Blogs */}
                                    {template.blogs && template.blogs.length > 0 && (
                                        <div className="mt-4">
                                            <h3
                                                className={`text-sm font-semibold ${
                                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                }`}
                                            >
                                                Associated Blogs:
                                            </h3>
                                            <ul
                                                className={`list-disc list-inside ${
                                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                }`}
                                            >
                                                {template.blogs.map((blog) => (
                                                    <li key={blog.id}>
                                                        <Link
                                                            href={
                                                                isGuest
                                                                    ? `/blogs/${blog.id}?guest=true`
                                                                    : `/blogs/${blog.id}`
                                                            }
                                                            className={`hover:underline ${
                                                                theme === 'dark' ? 'text-blue-300' : 'text-blue-500'
                                                            }`}
                                                        >
                                                            {blog.title}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400">
                            No templates found.
                        </p>
                    )}
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            disabled={page === 1}
                            className={`px-4 py-2 rounded-md ${
                                page === 1
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
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
            {editingTemplate && (
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
                            Edit Template
                        </h2>
                        <div className="space-y-4">
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
                                    value={editingTemplate.title}
                                    onChange={(e) =>
                                        setEditingTemplate({ ...editingTemplate, title: e.target.value })
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
                                    Explanation
                                </label>
                                <textarea
                                    value={editingTemplate.explanation}
                                    onChange={(e) =>
                                        setEditingTemplate({ ...editingTemplate, explanation: e.target.value })
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
                                    Code
                                </label>
                                <textarea
                                    value={editingTemplate.code}
                                    onChange={(e) =>
                                        setEditingTemplate({ ...editingTemplate, code: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                                            : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
                                    }`}
                                    rows={8}
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
                                    value={editingTemplate.tags.join(', ')}
                                    onChange={(e) =>
                                        setEditingTemplate({
                                            ...editingTemplate,
                                            tags: e.target.value.split(',').map((tag) => tag.trim()),
                                        })
                                    }
                                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                                            : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
                                    }`}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                onClick={() => setEditingTemplate(null)}
                                className={`px-6 py-2 rounded-md ${
                                    theme === 'dark'
                                        ? 'bg-gray-600 text-white hover:bg-gray-500'
                                        : 'bg-gray-300 text-black hover:bg-gray-400'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleUpdateTemplate(editingTemplate)}
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
                        Template deleted!
                </div>
            )}
            {updateNotification && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white py-2 px-4 rounded-md shadow-md transition-opacity duration-300">
                        Template Updated!
                </div>
            )}
        </div>
    );
};

export default ViewAllTemplates;
