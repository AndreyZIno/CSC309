import { useEffect, useState } from 'react';
import { withOptionalAuth } from '../lib/withAuth';

function Profile({ isGuest }: { isGuest: boolean }) {
  if (isGuest) {
    // Guest users see this restricted access message
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
        <h2 className="text-2xl font-bold mb-4 text-black">Restricted Access</h2>
        <p className="text-gray-700">
          You need to sign up or log in to edit your profile.
        </p>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    avatarFile: null as File | null, // File to upload
    avatarUrl: '/avatars/default_avatar.png', // Default avatar
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const response = await fetch('/api/users/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setFormData((prev) => ({
            ...prev,
            phone: data.phone || '',
            avatarUrl: data.avatar || '/avatars/default_avatar.png',
          }));
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to fetch user data.');
      }
    };

    fetchUser();
  }, []);

  const handleSubmit = async () => {
    setSuccess('');
    setError('');

    const form = new FormData();
    if (formData.phone) form.append('phone', formData.phone);
    if (formData.password) form.append('password', formData.password);
    if (formData.avatarFile) form.append('avatar', formData.avatarFile);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: form,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess('Profile updated successfully!');

      // Update avatar URL for live preview
      const avatarUrl = `${data.updatedUser.avatar}?timestamp=${Date.now()}`;
      setFormData((prev) => ({
        ...prev,
        avatarUrl,
        avatarFile: null, // Reset the file input
      }));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-4 text-black">Edit Profile</h2>
      {success && <p className="text-green-500 mb-4">{success}</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="mb-4">
          <label className="block text-black font-medium mb-2">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
          />
        </div>
        <div className="mb-4">
          <label className="block text-black font-medium mb-2">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
          />
        </div>
        <div className="mb-4">
          <label className="block text-black font-medium mb-2">Avatar</label>
          {formData.avatarUrl && (
            <img
              src={formData.avatarUrl}
              alt="Avatar Preview"
              className="w-20 h-20 rounded-full mb-4"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setFormData((prev) => ({ ...prev, avatarFile: file }));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:outline-none text-black"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Save
        </button>
      </form>
    </div>
  );
}

export default withOptionalAuth(Profile);
