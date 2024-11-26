import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from "../components/ThemeToggle";

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
    const { theme } = useTheme(); // Get the current theme

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
        <div className="relative min-h-screen flex flex-col overflow-auto">
            {/* Particle Background */}
            <div id="particles-js" className="fixed top-0 left-0 w-full h-full -z-10"></div>

            <div className="flex flex-grow items-center justify-center py-8">
                <main
                    className={`w-11/12 max-w-5xl shadow-lg rounded-lg p-6 border transition-colors ${
                        theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-yellow-200"
                            : "bg-white border-gray-200 text-gray-700"
                    }`}
                >
                    {/* Code editor content */}
                    <div
                        className={`border-b pb-4 mb-6 rounded-lg p-4 shadow-sm transition-colors ${
                            theme === "dark"
                                ? "bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
                                : "bg-gradient-to-r from-blue-50 via-white to-blue-50"
                        }`}
                    >
                        <div className="flex justify-between items-center">
                            <h2
                                className={`text-2xl font-bold shadow-sm ${
                                    theme === "dark" ? "text-yellow-300" : "text-sky-700"
                                }`}
                            >
                                Code Editor
                            </h2>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className={`border rounded-lg p-2 shadow-md focus:ring focus:outline-none transition-colors ${
                                    theme === "dark"
                                        ? "bg-gray-700 border-gray-600 text-yellow-200 focus:ring-yellow-400"
                                        : "bg-white border-gray-300 text-sky-700 focus:ring-blue-300"
                                }`}
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="c">C</option>
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                            </select>
                        </div>
                        <p
                            className={`text-sm mt-2 transition-colors ${
                                theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                            Start writing your code below:
                        </p>
                    </div>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Write your code here..."
                        className={`w-full h-64 rounded-lg p-4 text-sm font-mono shadow-inner focus:outline-none focus:ring transition-colors ${
                            theme === "dark"
                                ? "bg-gray-700 border-gray-600 text-yellow-200 focus:ring-yellow-400"
                                : "bg-sky-50 border-sky-200 text-gray-700 focus:ring-blue-300"
                        }`}
                    />
                </main>
            </div>
        </div>

    );
}