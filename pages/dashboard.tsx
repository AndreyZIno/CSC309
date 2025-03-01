import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Editor from "@monaco-editor/react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import TemplateForm from '../components/TemplateForm';
import { useTheme } from '../components/ThemeToggle';

export default function Dashboard() {
  const [user, setUser] = useState({
    avatar: '/avatars/default_avatar.png',
    firstName: 'Guest',
    isAdmin: false,
  });
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const router = useRouter();
  const isGuest = router.query.guest === 'true';
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        router.push('/dashboard?guest=true');
    }
  }, []);

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

  const handleLogout = () => {
    if (!isGuest) {
      localStorage.removeItem('accessToken');
    }
    router.push('/');
  };

  const executeCode = async () => {
    setOutput('');
    setError('');
    setLoading(true);

    const timeoutMs = 6000;

    const fetchWithTimeout = async () => {
        const controller = new AbortController(); // Create an AbortController
        const timeout = setTimeout(() => controller.abort(), timeoutMs); // Schedule abort

        try {
            const response = await fetch('/api/code/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language, input }),
                signal: controller.signal, // Pass the AbortController signal
            });

            clearTimeout(timeout); // Clear the timeout if fetch completes

            const result = await response.json();
            if (response.ok) {
                setOutput(result.stdout || '');
                setError(result.stderr || '');
            } else {
                setOutput(result.stdout || '');
                setError(result.stderr || result.error || 'Execution error.');
            }
        } catch (err) {
          if (err instanceof Error) { // Type narrowing for Error objects
              if (err.name === 'AbortError') {
                  setError('Request timed out. Please look for any potential infinite loops, fork bombs, etc.');
              } else {
                  setError('Failed to execute code.');
                  console.error('Execution error:', err);
              }
          } else {
              setError('An unexpected error occurred.');
              console.error('Unknown error:', err);
          }
      } finally {
        setLoading(false);
      }
    };

    await fetchWithTimeout();
  };


  const handleSaveTemplate = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        setError('You must be logged in to save templates.');
        return;
    }
    setShowTemplateForm(true);
};

  return (
    <div className="relative min-h-screen flex flex-col overflow-visible">
        <div id="particles-js" className="fixed top-0 left-0 w-full h-full -z-10"></div>
        <div className="flex flex-grow items-center justify-center py-8">
            <main 
                className={`w-11/12 max-w-5xl shadow-lg rounded-lg p-6 border transition-colors ${
                    theme === "dark"
                        ? "bg-gray-800 border-gray-700 text-yellow-200"
                        : "bg-white border-gray-200 text-gray-700"
                }`}
                style={{ position: 'relative', overflow: 'visible' }} // Allow dropdown to overflow
            >
                {/* Code editor content */}
                <div
                    className={`border-b pb-4 mb-6 rounded-lg p-4 shadow-sm transition-colors ${
                        theme === "dark"
                            ? "bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
                            : "bg-gradient-to-r from-blue-50 via-white to-blue-50"
                    }`}
                >
                <div className="border-b pb-2 mb-4">
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
                    <p
                        className={`text-sm mt-2 transition-colors ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                    >
                        Start writing your code below:
                    </p>
                </div>
                <Editor
                    height="300px"
                    language={language === "cs" ? "csharp" : language}
                    value={code}
                    onChange={(value: string | undefined) => setCode(value || "")}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        automaticLayout: true,
                    }}
                />
                <div className="mt-4">
                    <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Provide input here (if needed)..."
                    className="w-full h-24 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-800 dark:text-gray-200 focus:outline-none focus:ring focus:ring-blue-300"
                    />
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={executeCode}
                        disabled={loading}
                        className={`${
                        loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                        } text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring focus:ring-blue-300`}
                        >
                        {loading ? 'Running...' : 'Run Code'}
                    </button>
                    <button
                        onClick={handleSaveTemplate}
                        className="ml-4 bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:ring focus:ring-green-300"
                        >
                        Save Template
                    </button>
                </div>
                <div className="mt-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Output</h3>
                    <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm overflow-x-auto">
                        {output && !error && (
                            <div className="mb-4">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200">Stdout:</h4>
                                    <SyntaxHighlighter language={language === "cs" ? "csharp" : language} style={docco}>
                                        {output}
                                    </SyntaxHighlighter>
                            </div>
                        )}
                        {error && (
                            <>
                            <div className="mb-4">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200">Stdout:</h4>
                                <SyntaxHighlighter language={language === "cs" ? "csharp" : language} style={docco}>
                                    {output}
                                </SyntaxHighlighter>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200">Stderr:</h4>
                                    <SyntaxHighlighter language="text" style={docco}>
                                        {error}
                                    </SyntaxHighlighter>
                            </div>
                            </>
                            )}
                            {!output && !error && <p>No output yet.</p>}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            {showTemplateForm && (
                <TemplateForm
                    code={code}
                    language={language}
                    onClose={() => setShowTemplateForm(false)}
                />
            )}
        </div>
    );
}