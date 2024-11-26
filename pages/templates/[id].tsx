import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTheme } from '../../components/ThemeToggle';

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
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const isGuest = router.query.guest === 'true';
    const { theme } = useTheme();

    useEffect(() => {
        if (!id) return;

        const fetchTemplate = async () => {
            setLoading(true);
            setError(null);
            setSuccess(null);

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
            setError('You need to be logged in to fork templates.');
            return;
        }

        setError(null);
        setSuccess(null);

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
                setSuccess('Template forked successfully! Redirecting to the forked template...');
                setTimeout(() => {
                    router.push(`/templates/${data.forkedTemplate.id}`);
                }, 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to fork template.');
            }
        } catch (err) {
            setError('An unexpected error occurred while forking the template.');
        }
    };

    const handleRunCode = () => {
        const query: Record<string, string | undefined> = {
            code: template?.code,
            language: template?.language,
        };

        if (isGuest) {
            query.guest = 'true';
        }

        router.push({
            pathname: '/dashboard',
            query,
        });
    };

    if (loading) {
        return <p className="text-center">Loading template...</p>;
    }

    if (error) {
        return (
            <div
                className={`text-center p-4 rounded-md ${
                    theme === 'dark' ? 'bg-red-800 text-red-400' : 'bg-red-100 text-red-600'
                }`}
            >
                {error}
            </div>
        );
    }

    if (!template) {
        return <p className="text-center text-gray-500">Template not found.</p>;
    }

    return (
        <div
            className={`max-w-4xl mx-auto mt-10 p-6 rounded-lg shadow-md relative ${
                theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
            }`}
        >
            {success && (
                <div
                    className={`absolute top-4 left-1/2 transform -translate-x-1/2 p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-600'
                    }`}
                >
                    {success}
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <h1
                    className={`text-3xl font-semibold ${
                        theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
                    }`}
                >
                    {template.title}
                </h1>
                <div className="flex space-x-4">
                    <button
                        onClick={handleRunCode}
                        className={`px-6 py-2 rounded-md text-sm font-semibold ${
                            theme === 'dark'
                                ? 'bg-blue-500 hover:bg-blue-400 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        Run
                    </button>
                    <button
                        onClick={handleForkTemplate}
                        className={`px-6 py-2 rounded-md text-sm font-semibold ${
                            theme === 'dark'
                                ? 'bg-green-500 hover:bg-green-400 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                    >
                        Fork
                    </button>
                </div>
            </div>
            <div className="mb-4">
                <p>
                    <strong>Description:</strong> <span>{template.explanation}</span>
                </p>
            </div>
            <div className="mb-4 text-sm space-y-1">
                <p>
                    <strong>Language:</strong> <span className="italic">{template.language}</span>
                </p>
                <p>
                    <strong>Tags:</strong> <span className="italic">{template.tags.join(', ')}</span>
                </p>
                <p>
                    <strong>By:</strong> {template.user.firstName} {template.user.lastName}
                </p>
            </div>
            <h2 className="text-lg font-semibold mb-2">Code:</h2>
            <pre
                className={`p-4 rounded-md text-sm font-mono ${
                    theme === 'dark'
                        ? 'bg-gray-700 text-gray-200 border-gray-600'
                        : 'bg-gray-100 text-gray-800 border-gray-300'
                }`}
            >
                <code>{template.code}</code>
            </pre>
        </div>
    );
};

export default ViewTemplate;
