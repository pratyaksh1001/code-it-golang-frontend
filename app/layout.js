"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/api";

import "nes.css/css/nes.min.css";
import "./globals.css";

export default function RootLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Public routes
        if (pathname === "/login" || pathname === "/register") {
            return;
        }

        const checkAuth = async () => {
            const token = Cookies.get("token");

            if (!token) {
                Cookies.remove("username");
                router.replace("/login");
                return;
            }

            try {
                const { data } = await api.post("/auth", {
                    token,
                });
                console.log(data);
                if (!data.status) {
                    Cookies.remove("token");
                    Cookies.remove("username");
                    router.replace("/login");
                }
            } catch (err) {
                console.error(err);

                Cookies.remove("token");
                Cookies.remove("username");
                router.replace("/login");
            }
        };

        checkAuth();
    }, [pathname, router]);

    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
