"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/api";

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const [username, setUsername] = useState("Player");

    const [loading, setLoading] = useState(true);

    const [article, setArticle] = useState({
        title: "",
        link: "",
        tags: [],
    });

    useEffect(() => {
        async function loadHome() {
            setUsername(Cookies.get("username") || "Player");

            try {
                const res = await api.get("/article");

                setArticle(res.data.result);
            } catch (err) {
                console.log(err);
            }

            setLoading(false);
            setMounted(true);
        }

        loadHome();
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
                        style={{
                            textDecoration: "none",
                        }}
                    >
                        Home
                    </Link>

                    <Link
                        href="/question_list"
                        className="nes-text is-warning"
                        style={{
                            textDecoration: "none",
                        }}
                    >
                        Problems
                    </Link>

                    <Link
                        href="/contests"
                        className="nes-text is-success"
                        style={{
                            textDecoration: "none",
                        }}
                    >
                        Contests
                    </Link>

                    <Link
                        href="/leaderboard"
                        className="nes-text is-error"
                        style={{
                            textDecoration: "none",
                        }}
                    >
                        Leaderboard
                    </Link>
                </div>

                <Link href="/profile">
                    <button className="nes-btn is-primary">{username}</button>
                </Link>
            </nav>
            {/* MAIN CONTENT */}

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    gap: "20px",
                }}
            >
                {/* Featured Programming Article */}

                <div
                    className="nes-container is-dark with-title"
                    style={{
                        flex: 2,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "40px",
                        textAlign: "center",
                    }}
                >
                    <p className="title">PROGRAMMING ARTICLE</p>

                    {loading ? (
                        <>
                            <h2 className="nes-text is-warning">
                                Loading article...
                            </h2>

                            <progress
                                className="nes-progress is-success"
                                value="50"
                                max="100"
                                style={{
                                    width: "400px",
                                    marginTop: "20px",
                                }}
                            />
                        </>
                    ) : (
                        <>
                            <h1
                                className="nes-text is-success"
                                style={{
                                    maxWidth: "900px",
                                    lineHeight: "1.4",
                                    marginBottom: "25px",
                                }}
                            >
                                {article.title}
                            </h1>

                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    justifyContent: "center",
                                    gap: "12px",
                                    marginBottom: "30px",
                                }}
                            >
                                {article.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="nes-text is-warning"
                                        style={{
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="nes-btn is-primary"
                            >
                                Read Full Article
                            </a>
                        </>
                    )}
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
                    {/* Contribute */}

                    <Link
                        href="/contribute"
                        className="nes-container is-dark with-title"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            textDecoration: "none",
                            gap: "20px",
                            padding: "30px",
                            transition: "0.2s",
                        }}
                    >
                        <p className="title">Contribute</p>

                        <h3 className="nes-text is-success">Create Problems</h3>

                        <p>
                            Submit your own programming questions and help
                            thousands of developers practice.
                        </p>
                    </Link>

                    {/* Problems */}

                    <Link
                        href="/question_list"
                        className="nes-container is-dark with-title"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            textDecoration: "none",
                            gap: "20px",
                            padding: "30px",
                            transition: "0.2s",
                        }}
                    >
                        <p className="title">Problems</p>

                        <h3 className="nes-text is-warning">Practice DSA</h3>

                        <p>
                            Solve hundreds of carefully curated coding
                            challenges across multiple topics and difficulty
                            levels.
                        </p>
                    </Link>

                    {/* Leaderboard */}

                    <Link
                        href="/leaderboard"
                        className="nes-container is-dark with-title"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            textDecoration: "none",
                            gap: "20px",
                            padding: "30px",
                            transition: "0.2s",
                        }}
                    >
                        <p className="title">Leaderboard</p>

                        <h3 className="nes-text is-error">Compete Globally</h3>

                        <p>
                            Compare your progress with other programmers and
                            climb the global rankings.
                        </p>
                    </Link>
                </div>
            </div>
        </main>
    );
}
