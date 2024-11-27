import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface TemplateFormProps {
    code?: string;
    language?: string;
    onClose?: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ code, language ='JavaScript', onClose }) => {
    const [title, setTitle] = useState('');
    const [explanation, setExplanation] = useState('');
    const [templateCode, setTemplateCode] = useState(code);
    const [templateLanguage, setTemplateLanguage] = useState(language);
    const [tags, setTags] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/');
        }
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!title || !explanation || !templateCode || !tags || !templateLanguage) {
            setError('All fields are required.');
            return;
        }

        setError(null);
        setSuccess(null);

        const token = localStorage.getItem('accessToken');

        if (!token) {
            setError('You must be logged in to create a template.');
            return;
        }

        try {
            const response = await fetch('/api/templates/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    explanation,
                    code: templateCode,
                    language: templateLanguage,
                    tags: tags.split(',').map((tag) => tag.trim()),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Something went wrong on the server.');
                return;
            }

            setSuccess('Template created successfully! Redirecting to all templates...');
            setTimeout(() => {
                onClose?.();
                router.push('/templates/viewAll');
            }, 3000);

        } catch (err) {
            console.error('Unexpected error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
            <div className="relative max-w-3xl w-full p-6 bg-white shadow-lg rounded-lg dark:bg-gray-800 dark:shadow-lg">
            <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => {
                    if (onClose) {
                        onClose(); // close passed from dashboard
                    } else if (router.pathname === "/templates/create") {
                        router.push('/templates/viewAll');
                    } else {
                        router.push('/dashboard');
                    }
                }}
            >
                ✕
            </button>
                <h1 className="text-3xl font-bold text-blue-600 mb-6 dark:text-blue-400">
                    Save Template
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
                            value={templateLanguage}
                            onChange={(e) => setTemplateLanguage(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-black"
                        >
                            <option value="c" className="text-black dark:text-white">C</option>
                            <option value="cpp" className="text-black dark:text-white">C++</option>
                            <option value="cs" className="text-black dark:text-white">C#</option>
                            <option value="haskell" className="text-black dark:text-white">Haskell</option>
                            <option value="java" className="text-black dark:text-white">Java</option>
                            <option value="javascript" className="text-black dark:text-white">JavaScript</option>
                            <option value="lua" className="text-black dark:text-white">Lua</option>
                            <option value="pascal" className="text-black dark:text-white">Pascal</option>
                            <option value="perl" className="text-black dark:text-white">Perl</option>
                            <option value="php" className="text-black dark:text-white">PHP</option>
                            <option value="python" className="text-black dark:text-white">Python</option>
                            <option value="ruby" className="text-black dark:text-white">Ruby</option>
                            <option value="rust" className="text-black dark:text-white">Rust</option>
                            <option value="shell" className="text-black dark:text-white">Shell</option>
                            <option value="swift" className="text-black dark:text-white">Swift</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 dark:text-gray-300">Code</label>
                        <textarea
                            value={templateCode}
                            onChange={(e) => setTemplateCode(e.target.value)}
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
                        Save Template
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TemplateForm;
