import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Template {
    id: number;
    title: string;
}

const BlogPostForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [templateIds, setTemplateIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/'); //non-logged in users shouldnt see this page
        }
    }, []);
    
    useEffect(() => {
        const fetchCurrentUser = async () => {
            const token = localStorage.getItem('accessToken');
            console.log('token:', token)
            if (!token) {
                setUserEmail(null);
                return;
            }

            try {
                const response = await fetch('/api/users/me', {
                    method: 'GET',
                    headers: {
                    Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserEmail(data.email);
                } else {
                    console.error('Failed to fetch user details');
                }
            } catch (err) {
                console.error('Error fetching current user:', err);
                }
        };

        fetchCurrentUser();
    }, []);
    
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!title || !description || !tags) {
            setError('Title, description, and tags are required');
            return;
        }
        const validatedTags = validateTags(tags);

        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/blogs/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    tags: validatedTags,
                    templateIds,
                    userEmail,
                }),
            });
            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    console.log('Error response from server:', errorData);
                    setError(errorData.error || 'Something went wrong.');
                } catch (parseError) {
                    console.error('Error parsing JSON response:', parseError);
                    setError('Something went wrong, and we could not parse the server response.');
                }
                return;
            }

            const data = await response.json();
            setSuccess('Blog post created successfully! Redirecting to all blogs...');

            setTitle('');
            setDescription('');
            setTags('');
            setTemplateIds([]);
            setUserEmail('');

            setTimeout(() => {
                router.push('/blogs/viewAll');
            }, 3000);
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };
    
    useEffect(() => {
        const fetchTemplates = async () => {
          try {
            const response = await fetch('/api/templates');
            if (!response.ok) {
              throw new Error('Failed to fetch templates');
            }
            const data = await response.json();
            setTemplates(data);
            setFilteredTemplates(data);
          } catch (err) {
            console.error('Error fetching templates:', err);
            setError('Failed to load templates');
          }
        };
    
        fetchTemplates();
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {  //<<<chatGPT code
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        setFilteredTemplates(
            templates.filter((template) => template.title.toLowerCase().includes(query))
        );
    };

    const handleTemplateSelect = (id: number) => {
        if (templateIds.includes(id)) {
            // Deselect, written by chatGPT
            setTemplateIds((prev) => prev.filter((templateId) => templateId !== id));
        } else {
            // Add to selected templates
            setTemplateIds((prev) => [...prev, id]);
        }
    };

    const validateTags = (tags: string): string => {
        const formattedTags = tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag !== '');
    
        return formattedTags.join(',');
    };

    return (
        <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-md dark:bg-gray-800 dark:shadow-lg">
            <h1 className="text-2xl text-blue-500 font-semibold mb-4 dark:text-blue-400">Create a Blog Post</h1>
            {error && <div className="text-red-500 mb-4 dark:text-red-400">{error}</div>}
            {success && <div className="text-green-500 mb-4 dark:text-green-400">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a cool title"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                    />
                </div>
                <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your interesting blog post"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                    />
                </div>
                <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300">Tags (comma-separated)</label>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="For ex: Typescript,Javascript"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                    />
                </div>
                <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300">Search Templates</label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search templates by name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                    />
                    </div>
                    <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300">Available Templates</label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md dark:border-gray-600">
                        {filteredTemplates.map((template) => (
                        <div key={template.id} className="flex items-center p-2 dark:text-white">
                            <input
                            type="checkbox"
                            checked={templateIds.includes(template.id)}
                            onChange={() => handleTemplateSelect(template.id)}
                            className="mr-2"
                            />
                            <label className="text-black dark:text-white">{template.title}</label>
                        </div>
                        ))}
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-400 dark:hover:bg-blue-500 dark:focus:ring-blue-300"
                >
                    Create!
                </button>
            </form>
        </div>
    );
};

export default BlogPostForm;