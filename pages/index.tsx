import { useState, useEffect } from 'react';
import AuthModal from '../components/AuthModal';
import { useRouter } from 'next/router';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'login' | 'register'>('login');
  const [typedText, setTypedText] = useState('');
  const router = useRouter();

  const fullText = 'Scriptorium';

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setTypedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const handleOpenModal = (type: 'login' | 'register') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleContinueAsGuest = () => {
    router.push('/dashboard?guest=true');
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center"
      style={{
        backgroundImage: "url('/background/index.jpg')",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div className="bg-white/80 backdrop-blur-md text-blue-900 p-10 rounded-lg shadow-lg border border-blue-200">
        <h1 className="text-5xl font-extrabold mb-6 text-center">
          Welcome to{' '}
          <span className="text-blue-600">
            {typedText}
            <span className="blinking-cursor">|</span>
          </span>
        </h1>
        <p className="text-lg font-medium text-center">
          A new way of writing, executing, and sharing your code.
        </p>
      </div>
      <div className="space-x-4 mt-8">
        <button
          onClick={() => handleOpenModal('login')}
          className="fancy-button bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white px-6 py-2 rounded-lg shadow-lg transition-transform transform hover:scale-110"
        >
          Login
        </button>
        <button
          onClick={() => handleOpenModal('register')}
          className="fancy-button bg-gradient-to-r from-teal-700 via-teal-800 to-teal-700 text-white px-6 py-2 rounded-lg shadow-lg transition-transform transform hover:scale-110"
        >
          Sign Up
        </button>
      </div>
      <div className="mt-10">
        <button
          onClick={handleContinueAsGuest}
          className="fancy-button bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white px-6 py-2 rounded-lg shadow-lg transition-transform transform hover:scale-110"
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
      <style jsx>{`
        .fancy-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease-out;
        }

        .fancy-button::after {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 300%;
          height: 100%;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.3)
          );
          transform: skewX(-45deg);
          transition: all 0.3s ease-out;
        }

        .fancy-button:hover {
          background: linear-gradient(to right, #4f83cc, #77aadd, #4f83cc);
        }

        .fancy-button:hover::after {
          left: 150%;
        }

        .blinking-cursor {
          display: inline-block;
          width: 15px; /* Adjusted width to make it thinner */
          height: 1em;
          background-color: rgba(0, 0, 0, 0.8); /* Solid color without any gradient or middle line */
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          0%, 100% {
            opacity: 0; /* Cursor hidden */
          }
          50% {
            opacity: 0; /* Cursor hidden */
          }
        }
      `}</style>
    </div>
  );
}
