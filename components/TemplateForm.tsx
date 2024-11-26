import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const TemplateForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [explanation, setExplanation] = useState('');
    const [code, setCode] = useState('');
    const [tags, setTags] = useState('');
    const [language, setLanguage] = useState('JavaScript'); // Default language
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/'); // Non-logged-in users shouldn't see this page
        }
    }, []);

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

            setSuccess('Template created successfully! Redirecting to all templates...');
            setTitle('');
            setExplanation('');
            setCode('');
            setTags('');
            setLanguage('JavaScript');

            setTimeout(() => {
                router.push('/templates/viewAll');
            }, 3000);

        } catch (err) {
            console.error('Unexpected error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg dark:bg-gray-800 dark:shadow-lg">
            <h1 className="text-3xl font-bold text-blue-600 mb-6 dark:text-blue-400">
                Create a Template
            </h1>
            {error && (
                <div className="text-red-500 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900 dark:text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="text-green-500 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900 dark:text-green-400">
                    {success}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a title"
                        className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-black"
                    />
                </div>
                <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300">Explanation</label>
                    <textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="Describe your template"
                        className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-black"
                    />
                </div>
                <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300">Programming Language</label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-black"
                    >
                        <option value="JavaScript" className="text-black dark:text-white">JavaScript</option>
                        <option value="Python" className="text-black dark:text-white">Python</option>
                        <option value="Java" className="text-black dark:text-white">Java</option>
                        <option value="C++" className="text-black dark:text-white">C++</option>
                        <option value="C#" className="text-black dark:text-white">C#</option>
                        <option value="Ruby" className="text-black dark:text-white">Ruby</option>
                        <option value="Go" className="text-black dark:text-white">Go</option>
                        <option value="PHP" className="text-black dark:text-white">PHP</option>
                        <option value="Swift" className="text-black dark:text-white">Swift</option>
                        <option value="TypeScript" className="text-black dark:text-white">TypeScript</option>
                        <option value="Rust" className="text-black dark:text-white">Rust</option>
                    </select>
                </div>
                <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300">Code</label>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Write your code here"
                        className="w-full px-4 py-2 rounded-lg border font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-black"
                    />
                </div>
                <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300">Tags (comma-separated)</label>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g., JavaScript, React"
                        className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-black"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
                >
                    Create Template
                </button>
            </form>
        </div>
    );
};

export default TemplateForm;
