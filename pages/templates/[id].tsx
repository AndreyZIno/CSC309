import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface Template {
    id: number;
    title: string;
    explanation: string;
    code: string;
    language: string;
    tags: string;
}

const TemplateDetails: React.FC = () => {
    const router = useRouter();
    const { id } = router.query;
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
                    setError(errorData.message || 'Something went wrong.');
                    setLoading(false);
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
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
            <h1 className="text-2xl text-blue-500 font-semibold mb-4">{template.title}</h1>
            <p className="text-gray-700 mb-4">{template.explanation}</p>
            <h3 className="text-lg text-gray-600 font-semibold">Code:</h3>
            <pre className="bg-gray-100 p-4 rounded-md text-sm text-gray-800 mb-4 overflow-auto">
                {template.code}
            </pre>
            <p className="text-sm text-gray-500">
                Language: <span className="italic">{template.language}</span>
            </p>
            <p className="text-sm text-gray-500">
                Tags: <span className="italic">{template.tags}</span>
            </p>
        </div>
    );
};

export default TemplateDetails;