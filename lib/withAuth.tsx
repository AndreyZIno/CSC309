import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export function withOptionalAuth<T>(
  WrappedComponent: React.ComponentType<T & { isGuest: boolean }>
) {
  return function ProtectedComponent(props: T) {
    const router = useRouter();
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsGuest(true); // Mark as guest if no token
      }
      setLoading(false);
    }, []);

    if (loading) {
      return <p>Loading...</p>; // Optional spinner can be added here
    }

    return <WrappedComponent {...props} isGuest={isGuest} />;
  };
}
