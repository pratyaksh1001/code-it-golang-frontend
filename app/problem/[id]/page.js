"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Cookies from "js-cookie";
import { useParams, useRouter } from "next/navigation";
import api from "@/api";

const Editor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
});

export default function ProblemPage() {
    const router = useRouter();
    const { id } = useParams();

    const [mounted, setMounted] = useState(false);
    const [username, setUsername] = useState("Player");

    // Question
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [sampleInput, setSampleInput] = useState("");
    const [sampleOutput, setSampleOutput] = useState("");

    // Editor
    const [language, setLanguage] = useState("python");
    const [theme, setTheme] = useState("vs-dark");
    const [code, setCode] = useState("");

    // Console
    const [consoleOpen, setConsoleOpen] = useState(true);
    const [consoleText, setConsoleText] = useState(
        "Run your code to see output...",
    );

    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;

        setMounted(true);
        setUsername(Cookies.get("username") || "Player");

        loadQuestion();
    }, [id]);

    async function loadQuestion() {
        try {
            const res = await api.get(`/problem/${id}`);

            setTitle(res.data.title);
            setDescription(res.data.description);
            setSampleInput(res.data.input);
            setSampleOutput(res.data.output);

            if (res.data.code) {
                setCode(res.data.code);
            }
        } catch (err) {
            console.log(err);
        }
    }

    async function runCode() {}

    async function submitCode() {}

    if (!mounted) return null;

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
                        style={{
                            textDecoration: "none",
                        }}
                    >
                        Home
                    </Link>

                    <Link
                        href="/problems"
                        className="nes-text is-warning"
                        style={{
                            textDecoration: "none",
                        }}
                    >
                        Problems
                    </Link>

                    <Link
                        href="/contribute"
                        className="nes-text is-success"
                        style={{
                            textDecoration: "none",
                        }}
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
                    overflow: "hidden",
                }}
            >
                {/* LEFT PANEL */}

                <div
                    className="nes-container is-dark with-title"
                    style={{
                        padding: "40px",
                        overflowY: "auto",
                    }}
                >
                    <p className="title">QUESTION</p>

                    <h2
                        className="nes-text is-success"
                        style={{
                            marginBottom: "25px",
                        }}
                    >
                        {title}
                    </h2>

                    <h3 className="nes-text is-primary">Description</h3>

                    <p
                        style={{
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.8",
                        }}
                    >
                        {description}
                    </p>

                    <hr />

                    <h3 className="nes-text is-warning">Sample Input</h3>

                    <pre
                        style={{
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {sampleInput}
                    </pre>

                    <hr />

                    <h3 className="nes-text is-error">Sample Output</h3>

                    <pre
                        style={{
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {sampleOutput}
                    </pre>
                </div>

                {/* RIGHT PANEL */}
                <div
                    className="nes-container is-dark with-title"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        padding: "20px",
                    }}
                >
                    <p className="title">CODE EDITOR</p>

                    {/* Toolbar */}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "20px",
                            flexWrap: "wrap",
                            marginBottom: "20px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: "15px",
                                alignItems: "center",
                            }}
                        >
                            {/* Language */}

                            <div className="nes-select is-dark">
                                <select
                                    value={language}
                                    onChange={(e) =>
                                        setLanguage(e.target.value)
                                    }
                                >
                                    <option value="python">Python</option>

                                    <option value="go">Go</option>

                                    <option value="javascript">
                                        JavaScript
                                    </option>
                                </select>
                            </div>

                            {/* Theme */}

                            <div className="nes-select is-dark">
                                <select
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                >
                                    <option value="vs-dark">VS Dark</option>

                                    <option value="light">Light</option>

                                    <option value="hc-black">
                                        High Contrast
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "15px",
                            }}
                        >
                            <button
                                className="nes-btn is-warning"
                                disabled={running}
                                onClick={runCode}
                            >
                                {running ? "Running..." : "Run"}
                            </button>

                            <button
                                className="nes-btn is-success"
                                disabled={submitting}
                                onClick={submitCode}
                            >
                                {submitting ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>

                    {/* Editor */}

                    <div
                        style={{
                            flex: 1,
                            minHeight: 0,
                            border: "3px solid white",
                            overflow: "hidden",
                        }}
                    >
                        <Editor
                            language={language}
                            theme={theme}
                            value={code}
                            onChange={(value) => setCode(value || "")}
                            options={{
                                minimap: {
                                    enabled: false,
                                },
                                fontSize: 16,
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                wordWrap: "on",
                                roundedSelection: false,
                                padding: {
                                    top: 15,
                                },
                            }}
                        />
                    </div>
                    {/* Console Header */}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "15px",
                        }}
                    >
                        <h3 className="nes-text is-warning">Console</h3>

                        <button
                            className="nes-btn is-primary"
                            onClick={() => setConsoleOpen(!consoleOpen)}
                        >
                            {consoleOpen ? "Hide" : "Show"}
                        </button>
                    </div>

                    {/* Console */}

                    {consoleOpen && (
                        <div
                            className="nes-container is-dark"
                            style={{
                                marginTop: "15px",
                                height: "220px",
                                overflowY: "auto",
                                overflowX: "hidden",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                fontFamily: "monospace",
                                padding: "18px",
                            }}
                        >
                            {consoleText}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
