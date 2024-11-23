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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [filter, setFilter] = useState<'all' | 'own'>('all'); // Added for filtering
  const isGuest = router.query.guest === 'true';

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

  // Fetch templates based on the filter (all or own)
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');

      // Determine the endpoint based on the selected filter
      const endpoint =
        filter === 'own'
          ? `/api/templates/viewOwn?page=${page}&search=${search}`
          : `/api/templates/viewAll?page=${page}&search=${search}`;

      const headers: HeadersInit = {};

      // Include Authorization header if fetching own templates
      if (filter === 'own' && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Something went wrong while fetching templates.');
        return;
      }

      const data = await response.json();

      // Adjust data handling based on the API response structure
      if (filter === 'own') {
        setHasMore(data.templates.length === 10); // Assuming pagination limit of 10
        setTemplates(data.templates);
      } else {
        setHasMore(data.length === 10); // Assuming pagination limit of 10
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
      alert('You need to be logged in to delete templates.');
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
            template.id === data.updatedTemplate.id ? { ...template, ...data.updatedTemplate } : template
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
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-md dark:bg-gray-800 dark:text-gray-200">
      <h1 className="text-2xl text-blue-500 font-semibold mb-4 dark:text-blue-300">View Templates</h1>
      {error && <div className="text-red-500 mb-4 dark:text-red-400">{error}</div>}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as 'all' | 'own');
            setPage(1); // Reset to first page when filter changes
          }}
          className="px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 text-black"
        >
          <option value="all">All Templates</option>
          <option value="own">My Templates</option>
        </select>
        <button
          onClick={() => setPage(1)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none"
        >
          Search
        </button>
      </div>
      <button
        onClick={() => router.push('/templates/create')}
        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none"
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
                <div
                  key={template.id}
                  className="p-4 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <Link
                    href={
                      isGuest ? `/templates/${template.id}?guest=true` : `/templates/${template.id}`
                    }
                    className="text-xl font-semibold text-blue-700 hover:underline dark:text-blue-300"
                  >
                    {template.title}
                  </Link>
                  <p className="text-gray-700 dark:text-gray-300">{template.explanation}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tags: <span className="italic">{template.tags.join(', ')}</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Language: <span className="italic">{template.language}</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    By: {template.user.firstName} {template.user.lastName}
                  </p>
                  {template.blogs && template.blogs.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Associated Blogs:
                      </h3>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                        {template.blogs.map((blog) => (
                          <li key={blog.id}>
                            <Link
                              href={
                                isGuest
                                  ? `/blogs/${blog.id}?guest=true`
                                  : `/blogs/${blog.id}`
                              }
                              className="text-blue-500 hover:underline dark:text-blue-300"
                            >
                              {blog.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-4">
                    {currentUserId === template.user.id && (
                      <>
                        <button
                          className="text-blue-500 hover:text-blue-700 flex items-center gap-1 dark:text-blue-300"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <FaEdit size={16} /> Edit
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700 flex items-center gap-1 dark:text-red-400"
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
            <p className="text-center text-gray-500 dark:text-gray-400">No templates found.</p>
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
          <div className="bg-white p-8 rounded-md max-w-2xl w-full">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Explanation</label>
                <textarea
                  value={editingTemplate.explanation}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, explanation: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Code</label>
                <textarea
                  value={editingTemplate.code}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, code: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  rows={8}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-6 py-2 bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateTemplate(editingTemplate)}
                className="px-6 py-2 bg-blue-500 text-white rounded-md"
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
