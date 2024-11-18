import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface NavbarProps {
  user: {
    avatar: string;
    firstName: string;
  };
  isGuest: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, isGuest, onLogout }) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const handleNavigateHome = () => {
    if (isGuest) {
      router.push('/dashboard?guest=true');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <nav className="bg-blue-600 text-white p-4 shadow">
      <div className="container mx-auto flex justify-between items-center">
      <h1
          className="text-xl font-bold cursor-pointer"
          onClick={handleNavigateHome}
        >
          Scriptorium
        </h1>
        <ul className="flex space-x-6">
            <li>
                <Link href={isGuest ? "/templates/viewAll?guest=true" : "/templates/viewAll"}>
                Templates
                </Link>
            </li>
            <li>
                <Link href={isGuest ? "/blogs/viewAll?guest=true" : "/blogs/viewAll"}>
                Blogs
                </Link>
            </li>
        </ul>
        {!isGuest ? (
          <div className="relative">
            <img
              src={user.avatar}
              alt="User Avatar"
              className="w-10 h-10 rounded-full cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
            />
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg">
                <ul>
                  <li
                    className="px-4 py-2 text-black hover:bg-gray-100 cursor-pointer"
                    onClick={() => alert('Dark Mode Toggle Coming Soon!')}
                  >
                    Dark Mode
                  </li>
                  <li
                    className="px-4 py-2 text-black hover:bg-gray-100 cursor-pointer"
                    onClick={() => router.push('/profile')}
                  >
                    Edit Profile
                  </li>
                  <li
                    className="px-4 py-2 text-black hover:bg-gray-100 cursor-pointer"
                    onClick={onLogout}
                  >
                    Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Exit
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;