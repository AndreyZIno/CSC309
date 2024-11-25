import { useEffect } from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Dynamically load the particles.js script
    const script = document.createElement('script');
    script.src = '/particles.js'; // Ensure the script is in your public folder
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
          move: { enable: true, speed: 2, direction: 'none' },
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
    <div className="relative min-h-screen">
      {/* Background container for particles */}
      <div id="particles-js" className="absolute top-0 left-0 w-full h-full -z-10"></div>
      {/* Main content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default Layout;
