import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState({
    avatar: '/avatars/default_avatar.png',
    firstName: 'Guest',
  });
  const router = useRouter();

  // Check if the user is a guest
  const isGuest = router.query.guest === 'true';

  // Fetch the user's details if not a guest
  useEffect(() => {
    const fetchUser = async () => {
      if (isGuest) return;

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
          setUser({
            avatar: data.avatar || '/avatars/default_avatar.png',
            firstName: data.firstName || 'User',
          });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();
  }, [isGuest]);

  // Logout function
  const handleLogout = () => {
    if (!isGuest) {
      localStorage.removeItem('accessToken'); // Clear access token
    }
    router.push('/'); // Redirect to the homepage
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-blue-600 text-white p-4 shadow">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Scriptorium</h1>
          <ul className="flex space-x-6">
            <li>
              <a href="#" className="hover:text-gray-200">
                Templates
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-200">
                Blogs
              </a>
            </li>
          </ul>
          {/* Avatar and Dropdown for all users */}
          <div className="relative">
            <img
              src={user.avatar} // Use user's avatar
              alt="User Avatar"
              className="w-10 h-10 rounded-full cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
            />
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg">
                <ul>
                  <li
                    className="px-4 py-2 text-black hover:bg-gray-100 cursor-pointer"
                    onClick={() => alert('Dark Mode Toggle Coming Soon!')}
                  >
                    Dark Mode
                  </li>
                  <li
                    className={`px-4 py-2 text-black ${
                      isGuest ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!isGuest) router.push('/profile');
                    }}
                  >
                    Edit Profile
                  </li>
                  <li
                    className="px-4 py-2 text-black hover:bg-gray-100 cursor-pointer"
                    onClick={handleLogout}
                  >
                    Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-grow">
        <main className="flex-grow flex flex-col items-center justify-center">
          <div className="w-11/12 max-w-4xl bg-white border rounded-lg shadow-lg p-4">
            <div className="border-b pb-2 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Code Editor</h2>
              <p className="text-sm text-gray-500">Start writing your code below:</p>
            </div>
            <textarea
              placeholder="Write your code here..."
              className="w-full h-64 bg-gray-100 border border-gray-300 rounded-lg p-4 text-sm font-mono text-gray-800 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
