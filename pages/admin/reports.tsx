import React, { useEffect, useState } from 'react';

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
  const [reportedItems, setReportedItems] = useState<ReportedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        setReportedItems([...formattedBlogs, ...formattedComments]);
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

      setReportedItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, hidden: true }
            : item
        )
      );
    } catch (err) {
      alert(`Error hiding ${type}.`);
      console.error(err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-md text-black">
      <h1 className="text-2xl font-bold mb-4">Reported Items</h1>
      {reportedItems.length > 0 ? (
        <ul>
          {reportedItems.map((item) => (
            <li key={item.id} className="mb-4 border-b pb-2">
              <p>
                <strong>{item.type === 'blog' ? 'Blog Title:' : 'Comment:'}</strong>{' '}
                {item.title || item.content}
              </p>
              <p>
                <strong>Reports:</strong> {item.reportsCount}
              </p>
              {item.hidden && (
                <p className="text-red-500 font-bold">This content is hidden.</p>
              )}
              <button
                onClick={() => hideContent(item.id, item.type)}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 mt-2"
                disabled={item.hidden}
              >
                {item.hidden ? 'Hidden' : `Hide ${item.type === 'blog' ? 'Blog' : 'Comment'}`}
              </button>
              <div className="mt-2">
                <strong>Reasons for Reports:</strong>
                <ul className="list-disc pl-5">
                  {item.reports.map((report, index) => (
                    <li key={index}>
                      "{report.reason}" - Reported by {report.user.firstName} {report.user.lastName}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No reported items found.</p>
      )}
    </div>
  );
};

export default AdminReports;
