import React, { useState, useEffect } from "react";
import "@/styles/globals.css";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import type { AppProps } from "next/app";
import { ThemeToggle, useTheme } from "../components/ThemeToggle";

export default function App({ Component, pageProps }: AppProps) {
    const [isGuest, setIsGuest] = useState(false);
    const [user, setUser] = useState({
        avatar: "/avatars/default_avatar.png",
        firstName: "Guest",
        isAdmin: false,
    });
    const router = useRouter();
    const showNavbar = router.pathname !== "/";

    useEffect(() => {
        const isGuestUser = router.query.guest === "true";
        setIsGuest(isGuestUser);

        if (!isGuestUser) {
            const fetchUser = async () => {
                const token = localStorage.getItem("accessToken");
                if (!token) return;

                try {
                    const response = await fetch("/api/users/me", {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUser({
                            avatar: data.avatar || "/avatars/default_avatar.png",
                            firstName: data.firstName || "User",
                            isAdmin: data.role === "ADMIN",
                        });
                    }
                } catch (err) {
                    console.error("Error fetching user:", err);
                }
            };

            fetchUser();
        }
    }, [router.query]);

    const handleLogout = () => {
        if (!isGuest) {
            localStorage.removeItem("accessToken");
        }
        setUser({
            avatar: "/avatars/default_avatar.png",
            firstName: "Guest",
            isAdmin: false,
        });
        router.push("/");
    };

    return (
        <ThemeToggle>
            <MainApp
                Component={Component}
                pageProps={pageProps}
                showNavbar={showNavbar}
                isGuest={isGuest}
                user={user}
                handleLogout={handleLogout}
            />
        </ThemeToggle>
    );
}

const MainApp: React.FC<any> = ({
    Component,
    pageProps,
    showNavbar,
    isGuest,
    user,
    handleLogout,
}) => {
    const { theme } = useTheme(); // Access theme within the ThemeToggle context

    useEffect(() => {
        // Dynamically load particles.js
        const script = document.createElement("script");
        script.src = "/particles.js"; // Ensure the script is in the public folder
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (window.particlesJS) {
                window.particlesJS("particles-js", {
                    particles: {
                        number: { value: 100, density: { enable: true, value_area: 800 } },
                        color: { value: theme === "dark" ? "#ffffff" : "#000000" }, // Node color
                        shape: { type: "circle" },
                        opacity: { value: 0.5 },
                        size: { value: 3, random: true },
                        line_linked: {
                            enable: true,
                            distance: 150,
                            color: theme === "dark" ? "#ffffff" : "#000000", // Line color
                            opacity: 0.4,
                            width: 1,
                        },
                        move: { enable: true, speed: 1, direction: "none" },
                    },
                    interactivity: {
                        detect_on: "canvas",
                        events: {
                            onhover: { enable: true, mode: "grab" },
                            onclick: { enable: true, mode: "push" },
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
            }
        };

        return () => {
            document.body.removeChild(script);
        };
    }, [theme]); // Reinitialize particles when theme changes

    return (
        <div className="relative min-h-screen">
            {/* Background gradient based on theme */}
            <div
                className={`fixed top-0 left-0 w-full h-full -z-20 ${
                    theme === "dark"
                        ? "bg-gradient-to-b from-gray-800 via-black to-blue-900"
                        : "bg-gradient-to-b from-blue-100 via-white to-blue-300"
                }`}
            ></div>

            {/* Particles.js canvas */}
            <div id="particles-js" className="fixed top-0 left-0 w-full h-full -z-10"></div>

            {/* Navbar */}
            {showNavbar && (
                <Navbar isGuest={isGuest} user={user} onLogout={handleLogout} />
            )}

            {/* Main content */}
            <Component {...pageProps} />
        </div>
    );
};
