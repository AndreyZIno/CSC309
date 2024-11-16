import { useState } from 'react';
import AuthModal from '../components/AuthModal';
import { useRouter } from 'next/router';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'login' | 'register'>('login');
  const router = useRouter();

  const handleOpenModal = (type: 'login' | 'register') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleContinueAsGuest = () => {
    router.push('/dashboard?guest=true'); // Redirect to the dashboard as a guest
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900">
      <div className="bg-blue-200 text-blue-900 p-10 rounded-lg shadow-lg">
        <h1 className="text-5xl font-extrabold mb-6">
          Welcome to <span className="text-blue-600">Scriptorium</span>
        </h1>
        <p className="text-lg font-medium">
          A new way of writing, executing, and sharing your code.
        </p>
      </div>
      <div className="space-x-4 mt-8">
        <button
          onClick={() => handleOpenModal('login')}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Login
        </button>
        <button
          onClick={() => handleOpenModal('register')}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Sign Up
        </button>
      </div>
      <div className="mt-10">
        <button
          onClick={handleContinueAsGuest}
          className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
        >
          Continue as Guest
        </button>
      </div>
      {isModalOpen && (
        <AuthModal
          type={modalType}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
