import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

type Template = {
  id: number;
  title: string;
  explanation: string;
  code: string;
  tags: string[];
  forked: boolean;
  userId: number; // The userId of the creator
};

export default function Templates() {
  const router = useRouter();
  const [ownTemplates, setOwnTemplates] = useState<Template[]>([]);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      const token = localStorage.getItem('accessToken');
      setAccessToken(token);
      setLoading(true);
      setError('');

      try {
        if (token) {
          const response = await fetch('/api/templates/viewOwn', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (response.ok) setOwnTemplates(data.templates);
          else throw new Error(data.error);
        }

        const allTemplatesResponse = await fetch('/api/templates/viewAll');
        const allTemplatesData = await allTemplatesResponse.json();
        if (allTemplatesResponse.ok) setAllTemplates(allTemplatesData);
        else throw new Error(allTemplatesData.error);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch templates.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleCreateTemplate = () => {
    if (!accessToken) {
      alert('You must be logged in to create a template.');
      return;
    }
    router.push('/templates/create');
  };

  const handleForkTemplate = async (templateId: number) => {
    if (!accessToken) {
      alert('You must be logged in to fork a template.');
      return;
    }
    try {
      const response = await fetch('/api/templates/fork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ templateId }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Template forked successfully!');
        router.reload();
      } else throw new Error(data.error);
    } catch (err: any) {
      alert(err.message || 'Failed to fork template.');
    }
  };

  const handleEditTemplate = (templateId: number) => {
    router.push(`/templates/edit/${templateId}`);
  };

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      const response = await fetch('/api/templates/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id: templateId }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Template deleted successfully!');
        router.reload();
      } else throw new Error(data.error);
    } catch (err: any) {
      alert(err.message || 'Failed to delete template.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Code Templates</h1>
      {loading && <p>Loading templates...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <button
        onClick={handleCreateTemplate}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Create New Template
      </button>
      <h2 className="text-xl font-semibold mb-2">Your Templates</h2>
      <div className="space-y-4">
        {ownTemplates.map((template) => (
          <div key={template.id} className="p-4 border rounded-lg shadow-md">
            <h3 className="font-bold">{template.title}</h3>
            <p className="text-sm text-gray-600">{template.explanation}</p>
            <div className="mt-2 space-x-2">
              <button
                onClick={() => handleEditTemplate(template.id)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteTemplate(template.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <h2 className="text-xl font-semibold mt-8 mb-2">All Templates</h2>
      <div className="space-y-4">
        {allTemplates.map((template) => (
          <div key={template.id} className="p-4 border rounded-lg shadow-md">
            <h3 className="font-bold">{template.title}</h3>
            <p className="text-sm text-gray-600">{template.explanation}</p>
            <div className="mt-2 space-x-2">
              <button
                onClick={() => handleForkTemplate(template.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Fork
              </button>
              {ownTemplates.some(
                (t) =>
                  t.id === template.id ||
                  (t.forked && t.title === template.title)
              ) && (
                <button
                  onClick={() => handleEditTemplate(template.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
