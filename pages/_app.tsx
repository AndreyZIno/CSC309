import React, { useState, useEffect } from 'react';
import "@/styles/globals.css";
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import type { AppProps } from 'next/app';
import { ThemeToggle } from "../components/ThemeToggle";

export default function App({ Component, pageProps }: AppProps) {
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState({
    avatar: '/avatars/default_avatar.png',
    firstName: 'Guest',
    isAdmin: false,
  });
  const router = useRouter();
  const showNavbar = router.pathname !== "/";

  useEffect(() => {
    const isGuestUser = router.query.guest === 'true';
    setIsGuest(isGuestUser);

    if (!isGuestUser) {
      const fetchUser = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
          const response = await fetch('/api/users/me', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            setUser({
              avatar: data.avatar || '/avatars/default_avatar.png',
              firstName: data.firstName || 'User',
              isAdmin: data.role === 'ADMIN', // Set isAdmin based on user role
            });
          }
        } catch (err) {
          console.error('Error fetching user:', err);
        }
      };

      fetchUser();
    }
  }, [router.query]);

  const handleLogout = () => {
    if (!isGuest) {
      localStorage.removeItem('accessToken');
    }
    setUser({
      avatar: '/avatars/default_avatar.png',
      firstName: 'Guest',
      isAdmin: false, // Reset to default values
    });
    router.push('/');
  };

  return (
    <ThemeToggle>
      {showNavbar && (
        <Navbar isGuest={isGuest} user={user} onLogout={handleLogout} />
      )}
      <Component {...pageProps} />
    </ThemeToggle>
  );
}
