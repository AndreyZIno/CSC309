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

  useEffect(() => {
    // Dynamically load particles.js
    const script = document.createElement('script');
    script.src = '/particles.js'; // Ensure the script is in the public folder
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.particlesJS('particles-js', {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: '#ffffff' },
          shape: { type: 'circle' },
          opacity: { value: 0.5 },
          size: { value: 3, random: true },
          line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.4, width: 1 },
          move: { enable: true, speed: 1, direction: 'none' },
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: true, mode: 'grab' },
            onclick: { enable: true, mode: 'push' },
            resize: true,
          },
          modes: {
            grab: { distance: 200, line_linked: { opacity: 1 } },
            bubble: { distance: 200, size: 40, duration: 2, opacity: 8 },
            repulse: { distance: 100 },
            push: { particles_nb: 4 },
          },
        },
        retina_detect: true,
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <ThemeToggle>
      <div className="relative min-h-screen">
        {/* Particles background */}
        <div id="particles-js" className="absolute top-0 left-0 w-full h-full -z-10"></div>

        {/* Navbar */}
        {showNavbar && (
          <Navbar isGuest={isGuest} user={user} onLogout={handleLogout} />
        )}

        {/* Main content */}
        <Component {...pageProps} />
      </div>
    </ThemeToggle>
  );
}
