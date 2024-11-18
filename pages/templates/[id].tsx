import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type Template = {
  id: number;
  title: string;
  explanation: string;
  tags: string[];
  code: string;
  language: string;
  user: {
    firstName: string;
    lastName: string;
  };
};

const ViewTemplate = () => {
  const router = useRouter();
  const { id } = router.query;
  const [template, setTemplate] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isGuest = router.query.guest === 'true';

  useEffect(() => {
    if (!id) return;

    const fetchTemplate = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/templates/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch template details.');
          return;
        }

        const data = await response.json();
        setTemplate(data);
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id]);

  const handleForkTemplate = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('You need to be logged in to fork templates.');
      return;
    }

    try {
      const response = await fetch(`/api/templates/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ templateId: template?.id }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Template forked successfully! Redirecting to the forked template...`);
        router.push(`/templates/${data.forkedTemplate.id}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to fork template.');
      }
    } catch (err) {
      console.error('Error forking template:', err);
      alert('An unexpected error occurred while forking the template.');
    }
  };

  const handleRunCode = () => {
    let path = '/dashboard';
    const query: Record<string, string | undefined> = {
      code: template?.code,
      language: template?.language,
    };
  
    if (isGuest) {
      query.guest = 'true';
    }
  
    router.push({
      pathname: path,
      query,
    });
  };  

  if (loading) {
    return <p className="text-center">Loading template...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  if (!template) {
    return <p className="text-center text-gray-500">Template not found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-md relative">
      <button
        onClick={handleForkTemplate}
        className="absolute top-4 right-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
      >
        Fork
      </button>
      <button
        onClick={handleRunCode}
        className="absolute top-4 right-20 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Run
      </button>
      <h1 className="text-2xl text-blue-500 font-semibold mb-4">{template.title}</h1>
      <p className="text-gray-700 mb-4">{template.explanation}</p>
      <p className="text-sm text-gray-500">
        Tags: <span className="italic">{template.tags.join(', ')}</span>
      </p>
      <p className="text-sm text-gray-500">
        Language: <span className="italic">{template.language}</span>
      </p>
      <p className="text-sm text-gray-500 mb-4">
        By: {template.user.firstName} {template.user.lastName}
      </p>
      <h2 className="text-lg font-semibold mb-2 text-black">Code:</h2>
      <pre className="p-4 bg-gray-100 border border-gray-300 rounded-md text-black font-mono">
        <code>{template.code}</code>
      </pre>
    </div>
  );
};

export default ViewTemplate;
