import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Template {
  id: number;
  title: string;
  explanation: string;
  tags: string[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
    id: number; // Add userId for ownership check
  };
  createdAt: string;
  forked: boolean;
}

const ViewAllTemplates: React.FC = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'mostRecent' | 'mostForked'>('mostRecent');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
/*
  useEffect(() => {
    // Fetch current user data
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
          setCurrentUserId(data.id); // Assume backend sends user ID
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    fetchCurrentUser();
  }, []);
*/
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/templates/viewAll?page=${page}&search=${search}&sortBy=${sortBy}`);
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Something went wrong while fetching templates.');
        return;
      }

      const data = await response.json();
      setHasMore(data.length === 10); // Assuming pagination limit of 10
      setTemplates(data);
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [page, search, sortBy]);

  const handleDeleteTemplate = async (templateId: number) => {
    const userEmail = localStorage.getItem('userEmail'); // Ensure userEmail is available
    if (!userEmail) {
      alert('You need to be logged in to delete templates.');
      return;
    }
  
    try {
      const response = await fetch(`/api/templates/delete?templateID=${templateId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ userEmail }), // Include the email in the request body
      });
  
      if (response.ok) {
        setTemplates((prevTemplates) => prevTemplates.filter((template) => template.id !== templateId));
        alert('Template deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete template.');
      }
    } catch (err) {
      alert('An unexpected error occurred while deleting the template.');
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
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'mostRecent' | 'mostForked')}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        >
          <option value="mostRecent">Most Recent</option>
          <option value="mostForked">Most Forked</option>
        </select>
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
                  Tags: <span className="italic">{template.tags.join(', ')}</span>
                </p>
                <p className="text-sm text-gray-500">
                  By: {template.user.firstName} {template.user.lastName}
                </p>
                <div className="flex items-center gap-4 mt-4">
                  {currentUserId === template.user.id && ( // Ownership check
                    <>
                      <Link href={`/templates/edit/${template.id}`} className="text-blue-500 flex items-center gap-1">
                        <FaEdit size={16} /> Edit
                      </Link>
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
    </div>
  );
};

export default ViewAllTemplates;
