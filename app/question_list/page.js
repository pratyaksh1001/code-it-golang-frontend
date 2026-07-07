"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/api";

export default function Problems() {
    const [mounted, setMounted] = useState(false);
    const [username, setUsername] = useState("Player");

    const [search, setSearch] = useState("");
    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setUsername(Cookies.get("username") || "Player");
        setMounted(true);

        fetchTags();
        fetchQuestions("", []);
    }, []);

    async function fetchTags() {
        try {
            const res = await api.get("/tags");

            setTags(Array.isArray(res.data.tags) ? res.data.tags : []);
        } catch (err) {
            console.error(err);
            setTags([]);
        }
    }

    async function fetchQuestions(query, selected) {
        setLoading(true);

        try {
            const res = await api.post("/question_list", {
                query: query,
                tags: selected,
            });

            console.log(res.data);

            if (Array.isArray(res.data.list)) {
                setQuestions(res.data.list);
            } else {
                setQuestions([]);
            }
        } catch (err) {
            console.error(err);
            setQuestions([]);
        }

        setLoading(false);
    }

    function toggleTag(tag) {
        let updated;

        if (selectedTags.includes(tag)) {
            updated = selectedTags.filter((t) => t !== tag);
        } else {
            updated = [...selectedTags, tag];
        }

        setSelectedTags(updated);
        fetchQuestions(search, updated);
    }

    function handleSearch() {
        fetchQuestions(search, selectedTags);
    }

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
                overflow: "hidden",
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

            {/* Search */}

            <div
                className="nes-container is-dark"
                style={{
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: "15px",
                    }}
                >
                    <input
                        className="nes-input is-dark"
                        placeholder="Search problems..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <button
                        className="nes-btn is-success"
                        onClick={handleSearch}
                    >
                        SEARCH
                    </button>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                        marginTop: "20px",
                    }}
                >
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            className={`nes-btn ${
                                selectedTags.includes(tag)
                                    ? "is-success"
                                    : "is-primary"
                            }`}
                            onClick={() => toggleTag(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Question List */}

            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                {loading ? (
                    <div
                        className="nes-container is-dark"
                        style={{
                            textAlign: "center",
                            padding: "40px",
                        }}
                    >
                        <h2 className="nes-text is-primary">
                            Loading Problems...
                        </h2>
                    </div>
                ) : questions.length === 0 ? (
                    <div
                        className="nes-container is-dark"
                        style={{
                            textAlign: "center",
                            padding: "40px",
                        }}
                    >
                        <h2 className="nes-text is-error">No Problems Found</h2>
                    </div>
                ) : (
                    questions.map((question, index) => (
                        <div
                            key={
                                question.id ??
                                question.qid ??
                                question.title ??
                                index
                            }
                            className="nes-container is-dark with-title"
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "20px",
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                }}
                            >
                                <p className="title">
                                    {question.title ??
                                        question.question ??
                                        "Untitled Question"}
                                </p>

                                {question.difficulty && (
                                    <p
                                        className={`nes-text ${
                                            question.difficulty === "Easy"
                                                ? "is-success"
                                                : question.difficulty ===
                                                    "Medium"
                                                  ? "is-warning"
                                                  : "is-error"
                                        }`}
                                    >
                                        {question.difficulty}
                                    </p>
                                )}

                                {Array.isArray(question.tags) &&
                                    question.tags.length > 0 && (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: "10px",
                                                marginTop: "15px",
                                            }}
                                        >
                                            {question.tags.map((tag, i) => (
                                                <button
                                                    key={`${tag}-${i}`}
                                                    className="nes-btn is-primary"
                                                    style={{
                                                        fontSize: "12px",
                                                        padding: "4px 12px",
                                                        cursor: "default",
                                                        whiteSpace: "normal",
                                                        wordBreak: "break-word",
                                                        overflowWrap:
                                                            "anywhere",
                                                    }}
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                            </div>

                            <Link
                                href={`/problem/${
                                    question.id ?? question.qid ?? index
                                }`}
                                style={{
                                    textDecoration: "none",
                                }}
                            >
                                <button className="nes-btn is-success">
                                    Solve →
                                </button>
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
