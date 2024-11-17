import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type Template = {
  id: number;
  title: string;
  explanation: string;
  tags: string[];
  code: string;
  user: {
    firstName: string;
    lastName: string;
  };
};

const ViewTemplate = () => {
  const router = useRouter();
  const { id } = router.query; // Get the template ID from the URL
  const [template, setTemplate] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
      <h1 className="text-2xl text-blue-500 font-semibold mb-4">{template.title}</h1>
      <p className="text-gray-700 mb-4">{template.explanation}</p>
      <p className="text-sm text-gray-500 mb-4">
        Tags: <span className="italic">{template.tags.join(', ')}</span>
      </p>
      <p className="text-sm text-gray-500 mb-4">
        By: {template.user.firstName} {template.user.lastName}
      </p>
      <h2 className="text-lg font-semibold mb-2">Code:</h2>
      <pre className="p-4 bg-gray-100 border border-gray-300 rounded-md text-black">
        <code>{template.code}</code>
      </pre>
    </div>
  );
};

export default ViewTemplate;
