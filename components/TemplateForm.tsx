import React, { useState } from 'react';

const TemplateForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [explanation, setExplanation] = useState('');
  const [code, setCode] = useState('');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('JavaScript'); // Default language
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title || !explanation || !code || !tags || !language) {
      setError('All fields are required.');
      return;
    }

    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('accessToken'); // Retrieve token from localStorage

    if (!token) {
      setError('You must be logged in to create a template.');
      return;
    }

    try {
      const response = await fetch('/api/templates/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Include the token here
        },
        body: JSON.stringify({
          title,
          explanation,
          code,
          language, // Include selected language
          tags: tags.split(',').map((tag) => tag.trim()),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Something went wrong on the server.');
        return;
      }

      setSuccess('Template created successfully!');
      setTitle('');
      setExplanation('');
      setCode('');
      setTags('');
      setLanguage('JavaScript'); // Reset to default language
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-md dark:bg-gray-800 dark:shadow-lg">
      <h1 className="text-2xl text-blue-500 font-semibold mb-4 dark:text-blue-400">Create a Template</h1>
      {error && <div className="text-red-500 mb-4 dark:text-red-400">{error}</div>}
      {success && <div className="text-green-500 mb-4 dark:text-green-400">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
        <label className="block font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block font-medium text-gray-700 dark:text-gray-300">Explanation</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Describe your template"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block font-medium text-gray-700 dark:text-gray-300">Programming Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
          >
            <option value="JavaScript">JavaScript</option>
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="C++">C++</option>
            <option value="C#">C#</option>
            <option value="Ruby">Ruby</option>
            <option value="Go">Go</option>
            <option value="PHP">PHP</option>
            <option value="Swift">Swift</option>
            <option value="TypeScript">TypeScript</option>
            <option value="Rust">Rust</option>
          </select>
        </div>
        <div>
          <label className="block font-medium text-gray-700 dark:text-gray-300">Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your code here"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-black font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
          />
        </div>
        <div>
        <label className="block font-medium text-gray-700 dark:text-gray-300">Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., JavaScript, React"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-400 dark:hover:bg-blue-500 dark:focus:ring-blue-300"
        >
          Create Template
        </button>
      </form>
    </div>
  );
};

export default TemplateForm;
