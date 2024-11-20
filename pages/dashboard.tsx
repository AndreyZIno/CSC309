import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [user, setUser] = useState({
    avatar: '/avatars/default_avatar.png',
    firstName: 'Guest',
    isAdmin: false
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
            isAdmin: data.role === 'ADMIN'
          });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();
  }, [isGuest]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-grow">
        <main className="flex-grow flex flex-col items-center justify-center">
          <div className="w-11/12 max-w-4xl bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4">
            <div className="border-b pb-2 mb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  Code Editor
                </h2>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-black dark:text-white bg-white dark:bg-gray-700"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Start writing your code below:</p>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Write your code here..."
              className="w-full h-64 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-800 dark:text-gray-200 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
        </main>
      </div>
    </div>
  );
}