import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [user, setUser] = useState({
    avatar: '/avatars/default_avatar.png',
    firstName: 'Guest',
    isAdmin: false,
  });
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const router = useRouter();
  const isGuest = router.query.guest === 'true';

  useEffect(() => {
    const { code: queryCode, language: queryLanguage } = router.query;
    if (queryCode) setCode(queryCode as string);
    if (queryLanguage) setLanguage(queryLanguage as string);
  }, [router.query]);

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

        if (response.ok) {
          const data = await response.json();
          setUser({
            avatar: data.avatar || '/avatars/default_avatar.png',
            firstName: data.firstName || 'User',
            isAdmin: data.role === 'ADMIN',
          });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();
  }, [isGuest]);

  return (
    <div
      className="min-h-screen flex flex-col"
    >
      <div className="flex flex-grow items-center justify-center py-8">
        <main className="w-11/12 max-w-5xl bg-white shadow-lg rounded-lg p-6 border border-sky-200">
          <div className="border-b pb-4 mb-6 bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-sky-700 shadow-sm">Code Editor</h2>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 text-sky-700 bg-white shadow-md focus:ring focus:ring-blue-300 focus:outline-none"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>
            <p className="text-sm text-gray-500 mt-2">Start writing your code below:</p>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your code here..."
            className="w-full h-64 bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm font-mono text-gray-700 shadow-inner focus:outline-none focus:ring focus:ring-blue-300"
          />
        </main>
      </div>
    </div>
  );
}
