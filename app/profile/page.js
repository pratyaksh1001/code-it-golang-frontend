"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/api";

export default function Profile() {
    const [mounted, setMounted] = useState(false);
    const [username, setUsername] = useState("Player");
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        async function loadProfile() {
            setUsername(Cookies.get("username") || "Player");

            try {
                const res = await api.post("/profile", {
                    token: Cookies.get("token"),
                });
                setHistory(res.data.result || []);
            } catch (err) {
                console.log(err);
            }

            setLoading(false);
            setMounted(true);
        }

        loadProfile();
    }, []);

    if (!mounted) return null;

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
            {/* NAVBAR */}

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
                <h2 className="nes-text is-success" style={{ margin: 0 }}>
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
                        href="/question_list"
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

            {/* PROFILE */}

            <div
                className="nes-container is-dark with-title"
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                {/* Header */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                        borderBottom: "2px solid #333",
                        paddingBottom: "15px",
                    }}
                >
                    <div>
                        <h2
                            className="nes-text is-success"
                            style={{ marginBottom: "10px" }}
                        >
                            {username}
                        </h2>

                        <p>Total Submissions: {history.length}</p>
                    </div>

                    <button className="nes-btn is-primary">Profile</button>
                </div>

                {/* Loading */}

                {loading ? (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            flexDirection: "column",
                            gap: "20px",
                        }}
                    >
                        <h3 className="nes-text is-warning">
                            Loading submission history...
                        </h3>

                        <progress
                            className="nes-progress is-success"
                            value="50"
                            max="100"
                            style={{
                                width: "400px",
                            }}
                        />
                    </div>
                ) : history.length === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <h2 className="nes-text is-error">
                            No submissions yet.
                        </h2>
                    </div>
                ) : (
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: "18px",
                            paddingRight: "10px",
                        }}
                    >
                        {history.map((item, index) => (
                            <div
                                key={index}
                                className="nes-container is-dark"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "20px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "10px",
                                    }}
                                >
                                    <h3 className="nes-text is-primary">
                                        Problem #{item.qid}
                                    </h3>

                                    <p>
                                        <span className="nes-text is-warning">
                                            Submitted:
                                        </span>{" "}
                                        {new Date(
                                            item.submitted_at,
                                        ).toLocaleString()}
                                    </p>
                                </div>

                                <div
                                    style={{
                                        textAlign: "right",
                                    }}
                                >
                                    <h2 className="nes-text is-success">
                                        {item.runtime} ms
                                    </h2>

                                    <p>Runtime</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
