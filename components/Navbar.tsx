import React, { useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import ThemeToggleButton from "./ThemeToggleButton";
import { useTheme } from "./ThemeToggle";

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
    const { theme } = useTheme();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleNavigateHome = () => {
        if (isGuest) {
            router.push("/dashboard?guest=true");
        } else {
            router.push("/dashboard");
        }
    };

    const handleDropdownBlur = (event: React.FocusEvent<HTMLDivElement>) => {
        if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.relatedTarget as Node)
        ) {
            setMenuOpen(false);
        }
    };

    return (
        <nav
            className={`p-4 shadow-md transition-all ${
                theme === "dark"
                    ? "bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 text-white"
                    : "bg-gradient-to-r from-blue-300 via-blue-400 to-blue-300 text-black"
            }`}
        >
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo */}
                <h1
                    className={`text-2xl font-extrabold cursor-pointer transition hover:scale-105 ${
                        theme === "dark"
                            ? "hover:text-yellow-400 text-white" // Dark theme: white text with yellow hover
                            : "hover:text-blue-500 text-blue-800" // Light theme: light blue text with dark blue hover
                    }`}
                    onClick={handleNavigateHome}
                >
                    Scriptorium
                </h1>

                {/* Navigation Links */}
                <ul className="flex space-x-6 items-center">
                    <li>
                        <Link
                            href={isGuest ? "/templates/viewAll?guest=true" : "/templates/viewAll"}
                            className={`px-4 py-2 rounded-lg transition font-semibold shadow-md ${
                                theme === "dark"
                                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-yellow-300"
                                    : "bg-blue-200 hover:bg-blue-300 text-blue-900 hover:text-blue-600"
                            }`}
                        >
                            Templates
                        </Link>
                    </li>
                    <li>
                        <Link
                            href={isGuest ? "/blogs/viewAll?guest=true" : "/blogs/viewAll"}
                            className={`px-4 py-2 rounded-lg transition font-semibold shadow-md ${
                                theme === "dark"
                                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-yellow-300"
                                    : "bg-blue-200 hover:bg-blue-300 text-blue-900 hover:text-blue-600"
                            }`}
                        >
                            Blogs
                        </Link>
                    </li>
                    {user.isAdmin && (
                        <li>
                            <Link
                                href="/admin/reports"
                                className={`px-4 py-2 rounded-lg transition font-semibold shadow-md ${
                                    theme === "dark"
                                        ? "bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-yellow-300"
                                        : "bg-blue-200 hover:bg-blue-300 text-blue-900 hover:text-blue-600"
                                }`}
                            >
                                Reports
                            </Link>
                        </li>
                    )}
                </ul>

                {/* Theme Toggle */}
                <ThemeToggleButton />

                {/* User Section */}
                {!isGuest ? (
                     <div
                        className="relative"
                        ref={dropdownRef}
                        tabIndex={0}
                        onBlur={handleDropdownBlur}
                    >
                        <img
                            src={user.avatar}
                            alt="User Avatar"
                            className="w-10 h-10 rounded-full cursor-pointer hover:ring-4 hover:ring-offset-2 hover:ring-blue-500 dark:hover:ring-yellow-400"
                            onClick={() => setMenuOpen(!menuOpen)}
                        />
                        {menuOpen && (
                            <div
                                className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border ${
                                    theme === "dark"
                                        ? "bg-gray-800 text-gray-200 border-gray-700"
                                        : "bg-white text-gray-800 border-gray-300"
                                }`}
                                style={{
                                    zIndex: 50, // Ensures it appears above other elements, from ChatGPT
                                }}
                            >
                                <ul>
                                    <li
                                        className={`px-4 py-2 cursor-pointer transition hover:bg-opacity-75 ${
                                            theme === "dark"
                                                ? "hover:bg-gray-700"
                                                : "hover:bg-gray-200"
                                        }`}
                                        onClick={() => router.push("/profile")}
                                    >
                                        Edit Profile
                                    </li>
                                    <li
                                        className={`px-4 py-2 cursor-pointer transition hover:bg-opacity-75 ${
                                            theme === "dark"
                                                ? "hover:bg-gray-700"
                                                : "hover:bg-gray-200"
                                        }`}
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
                        className={`ml-4 px-4 py-2 rounded-lg transition font-semibold ${
                            theme === "dark"
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                    >
                        Exit
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
