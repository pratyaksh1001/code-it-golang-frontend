"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const [username, setUsername] = useState("Player");

    useEffect(() => {
        setUsername(Cookies.get("username") || "Player 1");
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <main
            className="pixel-grid"
            style={{
                width: "100vw",
                height: "100vh",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
            }}
        >
            {/* Navbar */}
            <nav
                className="nes-container is-dark"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "18px 24px",
                    flexShrink: 0,
                }}
            >
                <h2
                    className="nes-text is-success"
                    style={{
                        margin: 0,
                    }}
                >
                    CODE-IT
                </h2>

                <div
                    style={{
                        display: "flex",
                        gap: "35px",
                        alignItems: "center",
                    }}
                >
                    <Link
                        href="/home"
                        className="nes-text is-primary"
                        style={{ textDecoration: "none" }}
                    >
                        Home
                    </Link>

                    <Link
                        href="/problems"
                        className="nes-text is-warning"
                        style={{ textDecoration: "none" }}
                    >
                        Problems
                    </Link>

                    <Link
                        href="/contests"
                        className="nes-text is-success"
                        style={{ textDecoration: "none" }}
                    >
                        Contests
                    </Link>

                    <Link
                        href="/leaderboard"
                        className="nes-text is-error"
                        style={{ textDecoration: "none" }}
                    >
                        Leaderboard
                    </Link>
                </div>

                <button className="nes-btn is-primary">{username}</button>
            </nav>

            {/* Main Content */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    gap: "20px",
                }}
            >
                {/* Large Card */}
                <div
                    className="nes-container is-dark with-title"
                    style={{
                        flex: 2,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        gap: "20px",
                    }}
                >
                    <p className="title">WELCOME</p>

                    <h2 className="nes-text is-success">
                        Welcome back, {username}!
                    </h2>

                    <p>Ready to improve your coding skills?</p>

                    <button className="nes-btn is-success">Start Coding</button>
                </div>

                {/* Bottom Cards */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "20px",
                        flex: 1,
                    }}
                >
                    <Link
                        href="/contribute"
                        className="nes-container is-dark with-title"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            gap: "15px",
                        }}
                    >
                        <p className="title">Contribute</p>

                        <p>Contribute a question to help the platform grow</p>
                    </Link>

                    <div
                        className="nes-container is-dark with-title"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            gap: "15px",
                        }}
                    >
                        <p className="title">Recent Contests</p>

                        <p>Compete with coders from around the world.</p>
                    </div>

                    <div
                        className="nes-container is-dark with-title"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            gap: "15px",
                        }}
                    >
                        <p className="title">Leaderboard</p>

                        <p>Check your global ranking.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
