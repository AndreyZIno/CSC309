import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Template {
    id: number;
    title: string;
    explanation: string;
    tags: string[];
    code: string;
    language: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
        id: number;
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
    const [limit] = useState(10);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await fetch('/api/users/me', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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

        try {
            const response = await fetch(`/api/templates/viewAll?page=${page}&limit=${limit}&search=${search}`);
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Something went wrong while fetching templates.');
                return;
            }

            const data = await response.json();
            
            setHasMore(data.length === limit);
            setTemplates(data);
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [page, search]);

    const handleDeleteTemplate = async (templateId: number) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert('You need to be logged in to delete templates.');
            return;
        }

        try {
            const userResponse = await fetch('/api/users/me', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!userResponse.ok) {
                alert('Failed to fetch user data. Please log in again.');
                return;
            }

            const user = await userResponse.json();
            const userEmail = user.email;

            const response = await fetch(`/api/templates/delete?templateID=${templateId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userEmail }),
            });

            if (response.ok) {
                setTemplates((prevTemplates) => prevTemplates.filter((template) => template.id !== templateId));
                alert('Template deleted successfully!');
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to delete template.');
            }
        } catch (err) {
            console.error('Error during delete operation:', err);
            alert('An unexpected error occurred while deleting the template.');
        }
    };

    const handleUpdateTemplate = async (updatedTemplate: Template) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert('You need to be logged in to edit templates.');
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
                        template.id === data.updatedTemplate.id
                            ? { ...template, ...data.updatedTemplate }
                            : template
                    )
                );
                setEditingTemplate(null);
                alert('Template updated successfully!');
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to update template.');
            }
        } catch (err) {
            console.error('Error during update operation:', err);
            alert('An unexpected error occurred while updating the template.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
            <h1 className="text-2xl text-blue-500 font-semibold mb-4">View All Templates</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="mb-4 flex gap-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <button
                    onClick={() => setPage(1)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Search
                </button>
            </div>
            <button
                onClick={() => router.push('/templates/create')}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
                Create Template
            </button>
            {loading ? (
                <p className="text-center">Loading templates...</p>
            ) : (
                <div>
                    {templates.length > 0 ? (
                        <div className="space-y-4">
                            {templates.map((template) => (
                                <div key={template.id} className="p-4 border border-gray-300 rounded-md">
                                    <Link href={`/templates/${template.id}`} className="text-xl font-semibold text-blue-700 hover:underline">
                                        {template.title}
                                    </Link>
                                    <p className="text-gray-700">{template.explanation}</p>
                                    <p className="text-sm text-gray-500">
                                        Tags: <span className="italic">{Array.isArray(template.tags) ? template.tags.join(', ') : template.tags}</span>
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Language: <span className="italic">{template.language}</span>
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        By: {template.user.firstName} {template.user.lastName}
                                    </p>
                                    {template.blogs && template.blogs.length > 0 && (
                                        <div className="mt-4">
                                            <h3 className="text-sm font-semibold text-gray-600">Associated Blogs:</h3>
                                            <ul className="list-disc list-inside text-gray-700">
                                                {template.blogs.map((blog) => (
                                                    <li key={blog.id}>
                                                        <Link href={`/blogs/${blog.id}`} className="text-blue-500 hover:underline">
                                                            {blog.title}
                                                        </Link>
                                                        <p className="text-gray-600">{blog.description}</p>
                                                        <p className="text-sm text-gray-500">
                                                            By: {blog.user.firstName} {blog.user.lastName} | {new Date(blog.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 mt-4">
                                        <>
                                            {console.log(`Comparing currentUserId (${currentUserId}) with blog.user.id (${template.user.id})`)}
                                            {console.log(template.user)}
                                        </>
                                        {currentUserId === template.user.id && (
                                            <>
                                                <button
                                                    className="text-blue-500 flex items-center gap-1"
                                                    onClick={() => setEditingTemplate(template)}
                                                >
                                                    <FaEdit size={16} /> Edit
                                                </button>
                                                <button
                                                    className="text-red-500 flex items-center gap-1"
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                >
                                                    <FaTrash size={16} /> Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">No templates found.</p>
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
            {editingTemplate && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center">
                    <div className="bg-white p-8 rounded-md max-w-2xl w-full shadow-lg">
                        <h2 className="text-2xl font-bold text-blue-500 mb-6">Edit Template</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Title</label>
                                <input
                                    type="text"
                                    value={editingTemplate.title}
                                    onChange={(e) =>
                                        setEditingTemplate({ ...editingTemplate, title: e.target.value })
                                    }
                                    placeholder="Template Title"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Explanation</label>
                                <textarea
                                    value={editingTemplate.explanation}
                                    onChange={(e) =>
                                        setEditingTemplate({
                                            ...editingTemplate,
                                            explanation: e.target.value,
                                        })
                                    }
                                    placeholder="Template Explanation"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-black resize-none"
                                    rows={4}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Code</label>
                                <textarea
                                    value={editingTemplate.code}
                                    onChange={(e) =>
                                        setEditingTemplate({
                                            ...editingTemplate,
                                            code: e.target.value,
                                        })
                                    }
                                    placeholder="Template Code"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-black font-mono resize-none"
                                    rows={8}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Tags (Comma-Separated)</label>
                                <input
                                    type="text"
                                    value={editingTemplate.tags.join(', ')}
                                    onChange={(e) =>
                                        setEditingTemplate({
                                            ...editingTemplate,
                                            tags: e.target.value.split(',').map((tag) => tag.trim()),
                                        })
                                    }
                                    placeholder="e.g., tag1, tag2, tag3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                onClick={() => setEditingTemplate(null)}
                                className="px-6 py-2 bg-gray-300 rounded-md text-black hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleUpdateTemplate(editingTemplate)}
                                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewAllTemplates;
