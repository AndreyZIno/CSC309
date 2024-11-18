import React, { useState, useEffect } from 'react';
import "@/styles/globals.css";
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState({ avatar: '/avatars/default_avatar.png', firstName: 'Guest' });
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
            setUser({ avatar: data.avatar || '/avatars/default_avatar.png', firstName: data.firstName || 'User' });
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
    router.push('/');
  };

  return (
    <>
      {showNavbar && (
        <Navbar isGuest={isGuest} user={user} onLogout={handleLogout} />
      )}
      <Component {...pageProps} />
    </>
  );
}
