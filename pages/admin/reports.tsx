import React, { useEffect, useState } from 'react';
import { useTheme } from '../../components/ThemeToggle';

interface Report {
  reason: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface ReportedItem {
  id: number;
  title?: string;
  content?: string;
  reportsCount: number;
  hidden: boolean;
  type: 'blog' | 'comment';
  reports: Report[];
}

const AdminReports: React.FC = () => {
  const [reportedBlogs, setReportedBlogs] = useState<ReportedItem[]>([]);
  const [reportedComments, setReportedComments] = useState<ReportedItem[]>([]);
  const [blogFilter, setBlogFilter] = useState<'all' | 'hidden' | 'notHidden'>('all');
  const [commentFilter, setCommentFilter] = useState<'all' | 'hidden' | 'notHidden'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const [blogsResponse, commentsResponse] = await Promise.all([
          fetch('/api/reporting/sortBlogReports', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/reporting/sortCommentReports', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const blogs = await blogsResponse.json();
        const comments = await commentsResponse.json();

        const formattedBlogs = blogs.map((blog: any) => ({
          id: blog.id,
          title: blog.title,
          reportsCount: blog._count.reports,
          hidden: blog.hidden,
          type: 'blog',
          reports: blog.reports,
        }));

        const formattedComments = comments.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          reportsCount: comment._count.reports,
          hidden: comment.hidden,
          type: 'comment',
          reports: comment.reports,
        }));

        setReportedBlogs(formattedBlogs);
        setReportedComments(formattedComments);
      } catch (err) {
        setError('Failed to fetch reported items.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const hideContent = async (id: number, type: 'blog' | 'comment') => {
    const token = localStorage.getItem('accessToken');
    const requestBody = type === 'blog' ? { blogPostId: id } : { commentId: id };

    try {
      const response = await fetch('/api/reporting/hideContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to hide ${type}.`);
      }

      if (type === 'blog') {
        setReportedBlogs((prev) =>
          prev.map((item) => (item.id === id ? { ...item, hidden: true } : item))
        );
      } else {
        setReportedComments((prev) =>
          prev.map((item) => (item.id === id ? { ...item, hidden: true } : item))
        );
      }
    } catch (err) {
      alert(`Error hiding ${type}.`);
      console.error(err);
    }
  };

  const filterItems = (
    items: ReportedItem[],
    filter: 'all' | 'hidden' | 'notHidden'
  ) => {
    let filtered = items;
    if (filter === 'hidden') {
      filtered = items.filter((item) => item.hidden);
    } else if (filter === 'notHidden') {
      filtered = items.filter((item) => !item.hidden);
    }
    return filtered.sort((a, b) => b.reportsCount - a.reportsCount);
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div
      className={`max-w-7xl mx-auto mt-10 p-6 rounded-md shadow-md ${
        theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
      }`}
    >
      <h1
        className={`text-2xl font-bold mb-6 ${
          theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
        }`}
      >
        Reported Items
      </h1>
      <div className="grid grid-cols-2 gap-6">
        {/* Blog Reports */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2
              className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
              }`}
            >
              Blog Reports
            </h2>
            <select
              value={blogFilter}
              onChange={(e) => setBlogFilter(e.target.value as 'all' | 'hidden' | 'notHidden')}
              className={`px-4 py-2 rounded-md focus:ring-2 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                  : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
              }`}
            >
              <option value="all">All</option>
              <option value="hidden">Hidden</option>
              <option value="notHidden">Not Hidden</option>
            </select>
          </div>
          <ul className="space-y-4">
            {filterItems(reportedBlogs, blogFilter).map((blog) => (
              <li
                key={blog.id}
                className={`p-4 rounded-md border shadow-sm ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                    : 'bg-gray-50 border-gray-300 text-gray-800'
                }`}
              >
                <p className="font-semibold">
                  Blog Title: <span className="font-normal">{blog.title}</span>
                </p>
                <p>Reports: {blog.reportsCount}</p>
                {blog.hidden && <p className="text-red-500 font-bold">This content is hidden.</p>}
                <button
                  onClick={() => hideContent(blog.id, 'blog')}
                  className={`px-4 py-2 mt-4 rounded-md ${
                    blog.hidden
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : theme === 'dark'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                  disabled={blog.hidden}
                >
                  {blog.hidden ? 'Hidden' : 'Hide Blog'}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Comment Reports */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2
              className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
              }`}
            >
              Comment Reports
            </h2>
            <select
              value={commentFilter}
              onChange={(e) => setCommentFilter(e.target.value as 'all' | 'hidden' | 'notHidden')}
              className={`px-4 py-2 rounded-md focus:ring-2 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                  : 'bg-gray-50 border-gray-300 text-black focus:ring-blue-500'
              }`}
            >
              <option value="all">All</option>
              <option value="hidden">Hidden</option>
              <option value="notHidden">Not Hidden</option>
            </select>
          </div>
          <ul className="space-y-4">
            {filterItems(reportedComments, commentFilter).map((comment) => (
              <li
                key={comment.id}
                className={`p-4 rounded-md border shadow-sm ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                    : 'bg-gray-50 border-gray-300 text-gray-800'
                }`}
              >
                <p className="font-semibold">
                  Comment: <span className="font-normal">{comment.content}</span>
                </p>
                <p>Reports: {comment.reportsCount}</p>
                {comment.hidden && (
                  <p className="text-red-500 font-bold">This content is hidden.</p>
                )}
                <button
                  onClick={() => hideContent(comment.id, 'comment')}
                  className={`px-4 py-2 mt-4 rounded-md ${
                    comment.hidden
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : theme === 'dark'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                  disabled={comment.hidden}
                >
                  {comment.hidden ? 'Hidden' : 'Hide Comment'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
