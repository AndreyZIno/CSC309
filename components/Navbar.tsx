import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ThemeToggle } from "../components/ThemeToggle";

interface NavbarProps {
  user: {
    avatar: string;
    firstName: string;
    isAdmin: boolean;
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
    <nav className="bg-blue-600 text-white p-4 shadow dark:bg-blue-900 dark:text-blue-200">
      <div className="container mx-auto flex justify-between items-center">
      <h1
          className="text-xl font-bold cursor-pointer hover:text-purple-200 dark:hover:text-yellow-500"
          onClick={handleNavigateHome}
        >
          Scriptorium
        </h1>
        <ul className="flex space-x-6">
            <li>
                <Link href={isGuest ? "/templates/viewAll?guest=true" : "/templates/viewAll"}
                  className="hover:underline dark:hover:text-yellow-500"
                >
                Templates
                </Link>
            </li>
            <li>
                <Link href={isGuest ? "/blogs/viewAll?guest=true" : "/blogs/viewAll"}
                  className="hover:underline dark:hover:text-yellow-500"
                >
                Blogs
                </Link>
          </li>
          {user.isAdmin && (
            <li>
              <Link href="/admin/reports">
                Reports
              </Link>
            </li>
          )}
        </ul>

        <ThemeToggleButton />
        
        {!isGuest ? (
          <div className="relative">
            <img
              src={user.avatar}
              alt="User Avatar"
              className="w-10 h-10 rounded-full cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
            />
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600">
                <ul>
                  <li
                    className="px-4 py-2 text-black hover:bg-gray-100 cursor-pointer dark:text-gray-200 dark:hover:bg-gray-600"
                    onClick={() => router.push('/profile')}
                  >
                    Edit Profile
                  </li>
                  <li
                    className="px-4 py-2 text-black hover:bg-gray-100 cursor-pointer dark:text-gray-200 dark:hover:bg-gray-600"
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
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 dark:bg-red-400 dark:hover:bg-red-500"
          >
            Exit
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;