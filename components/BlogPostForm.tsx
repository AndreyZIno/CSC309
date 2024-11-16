import React, { useState } from 'react';

const BlogPostForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [templateIds, setTemplateIds] = useState<number[]>([]);
    const [userEmail, setuserEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!title || !description || !tags) {
            setError('Title, description, and tags are required');
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/blogs/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    tags,
                    templateIds,
                    userEmail
                }),
            });
            console.log('Sending userEmail:', userEmail);
            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    console.log('Error response from server:', errorData);
                    setError(errorData.error || 'Something went wrong on the server.');
                } catch (parseError) {
                    console.error('Error parsing JSON response:', parseError);
                    setError('Something went wrong, and we could not parse the server response.');
                }
                return;
            }            

            const data = await response.json();
            setSuccess('Blog post created successfully!');
            console.log('Created blog post:', data);

            // Reset form
            setTitle('');
            setDescription('');
            setTags('');
            setTemplateIds([]);
            setuserEmail('');
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
            <h1 className="text-2xl text-blue-500 font-semibold mb-4">Create a Blog Post</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success && <div className="text-green-500 mb-4">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a cool title"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block font-medium text-gray-700">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your interesting blog post"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block font-medium text-gray-700">Tags (comma-separated)</label>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="For ex: Typescript,Javascript"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block font-medium text-gray-700">Template IDs</label>
                    <input
                        type="text"
                        value={templateIds.join(',')}
                        onChange={(e) =>
                            setTemplateIds(
                                e.target.value
                                    .split(',')
                                    .map((id) => parseInt(id.trim()))
                                    .filter((id) => !isNaN(id))
                            )
                        }
                        placeholder="TO DO"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block font-medium text-gray-700">User Email</label>
                    <textarea
                        value={userEmail}
                        onChange={(e) => setuserEmail(e.target.value)}
                        placeholder="example@coolUser.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Create!
                </button>
            </form>
        </div>
    );
};

export default BlogPostForm;