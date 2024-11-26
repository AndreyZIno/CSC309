import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Editor from "@monaco-editor/react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useTheme } from '../components/ThemeToggle';

export default function Dashboard() {
  const [user, setUser] = useState({
    avatar: '/avatars/default_avatar.png',
    firstName: 'Guest',
  });
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const isGuest = router.query.guest === 'true';
  const { theme } = useTheme();

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

    const timeoutMs = 8000;

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
      }
    };

    await fetchWithTimeout();
  };

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
                  <option value="c">C</option>
                  <option value="cs">C#</option>
                  <option value="cpp">C++</option>
                  <option value="haskell">Haskell</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                  <option value="lua">Lua</option>
                  <option value="pascal">Pascal</option>
                  <option value="perl">Perl</option>
                  <option value="php">PHP</option>
                  <option value="python">Python</option>
                  <option value="ruby">Ruby</option>
                  <option value="rust">Rust</option>
                  <option value="shell">Shell</option>
                  <option value="swift">Swift</option>
                </select>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Start writing your code below:</p>
            </div>
            <Editor
              height="300px"
              language={language === "cs" ? "csharp" : language}
              value={code}
              onChange={(value: string | undefined) => setCode(value || "")}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                fontSize: 13,
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
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
              >
                Run Code
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
    </div>
  );
}