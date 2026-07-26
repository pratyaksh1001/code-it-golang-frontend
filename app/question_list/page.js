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

    const [showTagDropdown, setShowTagDropdown] = useState(false);

    useEffect(() => {
        setMounted(true);
        setUsername(Cookies.get("username") || "Player");

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
                query,
                tags: selected,
            });

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
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                overflow: "hidden",
            }}
        >
            {/* ================= NAVBAR ================= */}

            <nav
                className="nes-container is-dark"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 22px",
                    flexShrink: 0,
                }}
            >
                <h2
                    className="nes-text is-success"
                    style={{ margin: 0 }}
                >
                    CODE-IT
                </h2>

                <div
                    style={{
                        display: "flex",
                        gap: "32px",
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

                <Link href="/profile">
                    <button className="nes-btn is-primary">
                        {username}
                    </button>
                </Link>
            </nav>

            {/* ================= SEARCH ================= */}

            <div
                className="nes-container is-dark"
                style={{
                    flexShrink: 0,
                    padding: "14px 18px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        position: "relative",
                    }}
                >
                    <input
                        className="nes-input is-dark"
                        placeholder="Search problems..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        style={{
                            flex: 1,
                        }}
                    />

                    <button
                        className="nes-btn is-primary"
                        style={{
                            minWidth: "110px",
                            fontSize: "12px",
                            padding: "8px 12px",
                        }}
                        onClick={() =>
                            setShowTagDropdown(
                                !showTagDropdown
                            )
                        }
                    >
                        Tags ▼
                    </button>

                    <button
                        className="nes-btn is-success"
                        onClick={handleSearch}
                    >
                        Search
                    </button>

                    {showTagDropdown && (
                        <div
                            className="nes-container is-dark"
                            style={{
                                position: "absolute",
                                top: "58px",
                                right: "120px",
                                width: "220px",
                                maxHeight: "240px",
                                overflowY: "auto",
                                zIndex: 100,
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                            }}
                        >
                            {tags.map((tag) => (
                                <label
                                    key={tag}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        cursor: "pointer",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        className="nes-checkbox"
                                        checked={selectedTags.includes(
                                            tag
                                        )}
                                        onChange={() =>
                                            toggleTag(tag)
                                        }
                                    />

                                    <span
                                        style={{
                                            fontSize: "13px",
                                        }}
                                    >
                                        {tag}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {selectedTags.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginTop: "10px",
                        }}
                    >
                        {selectedTags.map((tag) => (
                            <button
                                key={tag}
                                className="nes-btn is-success"
                                style={{
                                    fontSize: "11px",
                                    padding: "2px 8px",
                                }}
                                onClick={() =>
                                    toggleTag(tag)
                                }
                            >
                                {tag} ✕
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ================= QUESTIONS ================= */}

            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit,minmax(430px,1fr))",
                    gap: "16px",
                    alignContent: "start",
                    paddingRight: "4px",
                }}
            >
            {loading ? (
                <div
                    className="nes-container is-dark"
                    style={{
                        gridColumn: "1 / -1",
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
                        gridColumn: "1 / -1",
                        textAlign: "center",
                        padding: "40px",
                    }}
                >
                    <h2 className="nes-text is-error">
                        No Problems Found
                    </h2>
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
                            minHeight: "185px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            padding: "14px",
                        }}
                    >
                        <div>
                            <p
                                className="title"
                                style={{
                                    fontSize: "18px",
                                    marginBottom: "8px",
                                    wordBreak: "break-word",
                                }}
                            >
                                {question.title ??
                                    question.question ??
                                    "Untitled Question"}
                            </p>

                            {question.difficulty && (
                                <span
                                    className={`nes-text ${
                                        question.difficulty === "Easy"
                                            ? "is-success"
                                            : question.difficulty ===
                                              "Medium"
                                            ? "is-warning"
                                            : "is-error"
                                    }`}
                                    style={{
                                        fontSize: "13px",
                                    }}
                                >
                                    {question.difficulty}
                                </span>
                            )}

                            {Array.isArray(question.tags) &&
                                question.tags.length > 0 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "6px",
                                            marginTop: "12px",
                                        }}
                                    >
                                        {question.tags.map(
                                            (tag, i) => (                                                <button
                                                key={`${tag}-${i}`}
                                                className="nes-btn is-primary"
                                                style={{
                                                    fontSize: "10px",
                                                    padding: "2px 7px",
                                                    cursor: "default",
                                                    minHeight: "28px",
                                                    lineHeight: 1.2,
                                                }}
                                            >
                                                {tag}
                                            </button>
                                        ))
                                    }
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                                marginTop: "14px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.75,
                                }}
                            >
                                ID:{" "}
                                {question.id ??
                                    question.qid ??
                                    index}
                            </div>

                            <Link
                                href={`/problem/${
                                    question.id ??
                                    question.qid ??
                                    index
                                }`}
                                style={{
                                    textDecoration: "none",
                                }}
                            >
                                <button
                                    className="nes-btn is-success"
                                    style={{
                                        padding:
                                            "6px 14px",
                                        fontSize:
                                            "12px",
                                    }}
                                >
                                    Solve →
                                </button>
                            </Link>
                        </div>
                    </div>
                ))
            )}
            </div>
        </main>
    );
}
