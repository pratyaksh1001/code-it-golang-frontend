"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/api";
import { useRouter } from "next/navigation";

export default function CreateProblem() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [username, setUsername] = useState("Player");

    const [description, setDescription] = useState("");
    const [sampleInput, setSampleInput] = useState("");
    const [sampleOutput, setSampleOutput] = useState("");

    const [tag, setTag] = useState("");
    const [tags, setTags] = useState([]);

    useEffect(() => {
        setUsername(Cookies.get("username") || "Player");
        setMounted(true);
    }, []);
    async function create_problem() {
        var data = {};
        data["tags"] = tags;
        data["token"] = Cookies.get("token");
        data["output"] = sampleOutput;
        data["input"] = sampleInput;
        data["question"] = description;

        var res = await api.post("/question", data);
        if (!res.data.created) {
            console.log("error creating question");
        } else {
            router.push("/home");
        }
    }

    if (!mounted) return null;

    const addTag = () => {
        const value = tag.trim();

        if (!value) return;

        if (!tags.includes(value)) {
            setTags([...tags, value]);
        }

        setTag("");
    };

    const removeTag = (value) => {
        setTags(tags.filter((t) => t !== value));
    };

    return (
        <main
            className="pixel-grid"
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                padding: "20px",
                gap: "20px",
                overflow: "hidden",
            }}
        >
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
                <h2 className="nes-text is-success">CODE-IT</h2>

                <div
                    style={{
                        display: "flex",
                        gap: "35px",
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
                        href="/contribute"
                        className="nes-text is-success"
                        style={{ textDecoration: "none" }}
                    >
                        Contribute
                    </Link>
                </div>

                <button className="nes-btn is-primary">{username}</button>
            </nav>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 3fr",
                    gap: "20px",
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                }}
            >
                {/* Left Panel */}

                <div
                    className="nes-container is-dark with-title"
                    style={{
                        padding: "50px",
                        height: "100%",
                        minHeight: 0,
                        overflowY: "auto",
                        overflowX: "hidden",
                    }}
                >
                    <p className="title">CREATE PROBLEM</p>

                    <div className="nes-field">
                        <label>Description</label>

                        <textarea
                            className="nes-textarea is-dark"
                            rows="8"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <br />

                    <div className="nes-field">
                        <label>Sample Input</label>

                        <textarea
                            className="nes-textarea is-dark"
                            rows="5"
                            value={sampleInput}
                            onChange={(e) => setSampleInput(e.target.value)}
                        />
                    </div>

                    <br />

                    <div className="nes-field">
                        <label>Sample Output</label>

                        <textarea
                            className="nes-textarea is-dark"
                            rows="5"
                            value={sampleOutput}
                            onChange={(e) => setSampleOutput(e.target.value)}
                        />
                    </div>

                    <br />

                    <div className="nes-field">
                        <label>Add Tag</label>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                            }}
                        >
                            <input
                                className="nes-input is-dark"
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                            />

                            <button
                                className="nes-btn is-success"
                                onClick={addTag}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <br />

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                        }}
                    >
                        {tags.map((t) => (
                            <button
                                key={t}
                                className="nes-btn is-warning"
                                onClick={() => removeTag(t)}
                            >
                                {t} ✕
                            </button>
                        ))}
                    </div>

                    <br />

                    <button
                        onClick={create_problem}
                        className="nes-btn is-primary"
                        style={{
                            width: "100%",
                        }}
                    >
                        CREATE PROBLEM
                    </button>
                </div>
                {/* Right Panel */}

                <div
                    className="nes-container is-dark with-title"
                    style={{
                        padding: "50px",
                        height: "100%",
                        minHeight: 0,
                        overflowY: "auto",
                        overflowX: "hidden",
                    }}
                >
                    <p className="title">LIVE PREVIEW</p>

                    <h2 className="nes-text is-success">Problem Description</h2>

                    <p
                        style={{
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {description || "Start writing your problem..."}
                    </p>

                    <hr />

                    <h3 className="nes-text is-warning">Sample Input</h3>

                    <pre
                        style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    >
                        {sampleInput || "Sample input will appear here."}
                    </pre>

                    <hr />

                    <h3 className="nes-text is-primary">Sample Output</h3>

                    <pre
                        style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    >
                        {sampleOutput || "Sample output will appear here."}
                    </pre>

                    <hr />

                    <h3>Tags</h3>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                        }}
                    >
                        {tags.length === 0 ? (
                            <p
                                style={{
                                    opacity: 0.7,
                                }}
                            >
                                No tags added.
                            </p>
                        ) : (
                            tags.map((t) => (
                                <span key={t} className="nes-btn is-primary">
                                    <span className="is-success">{t}</span>
                                </span>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
