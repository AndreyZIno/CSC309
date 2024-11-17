import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function EditTemplate() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({
    title: '',
    explanation: '',
    code: '',
    tags: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!id) return;
      try {
        const response = await fetch(`/api/templates/${id}`);
        const data = await response.json();
        if (response.ok) {
          setFormData({
            title: data.title,
            explanation: data.explanation,
            code: data.code,
            tags: data.tags.join(','),
          });
        } else throw new Error(data.error);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchTemplate();
  }, [id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/templates/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ templateId: id, ...formData, tags: formData.tags.split(',') }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      alert('Template updated successfully!');
      router.push('/templates');
    } catch (err: any) {
      setError(err.message || 'Failed to update template.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-white shadow-md rounded-md">
      <h1 className="text-xl font-bold mb-4">Edit Template</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Explanation</label>
          <textarea
            name="explanation"
            value={formData.explanation}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Code</label>
          <textarea
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Tags (comma-separated)</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
