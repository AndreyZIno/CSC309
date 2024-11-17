import { useRouter } from 'next/router';
import { useState } from 'react';

type AuthModalProps = {
  type: 'login' | 'register';
  onClose: () => void;
};

export default function AuthModal({ type, onClose }: AuthModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'USER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Validate required fields for signup
    if (type === 'register') {
      const { firstName, lastName, email, password, phone } = formData;
      if (!firstName || !lastName || !email || !password || !phone) {
        setError('All fields are required for signup.');
        setLoading(false);
        return;
      }
    }

    // Validate required fields for login
    if (type === 'login') {
      const { email, password } = formData;
      if (!email || !password) {
        setError('Email and password are required for login.');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/users/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (type === 'login') {
        // Save the token to localStorage
        localStorage.setItem('accessToken', data.accessToken);

        // Navigate to dashboard
        router.push('/dashboard');
        onClose();
        return;
      }

      // Handle signup success (3-second timer)
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      setTimeout(() => {
        clearInterval(timer);
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {type === 'login' ? 'Login' : 'Sign Up'}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {type === 'register' && countdown < 3 && countdown > 0 && (
          <p className="mb-4 p-3 bg-green-100 text-green-800 border border-green-300 rounded-lg">
            Sign up successful! Redirecting in <strong>{countdown}</strong> seconds...
          </p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          {type === 'register' && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring focus:ring-blue-300 focus:outline-none"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring focus:ring-blue-300 focus:outline-none"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring focus:ring-blue-300 focus:outline-none"
                  required
                />
              </div>
            </>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring focus:ring-blue-300 focus:outline-none"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring focus:ring-blue-300 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full py-2 rounded-lg text-white ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            disabled={loading}
          >
            {loading ? 'Submitting...' : type === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
