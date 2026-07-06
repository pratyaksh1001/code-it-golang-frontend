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
    const [showTestcaseForm, setShowTestcaseForm] = useState(false);
    const [testcaseInput, setTestcaseInput] = useState("");
    const [testcaseOutput, setTestcaseOutput] = useState("");
    const [testcaseSubmitting, setTestcaseSubmitting] = useState(false);
    const [popupOpen, setPopupOpen] = useState(false);

    const [popup, setPopup] = useState({
        success: false,
        message: "",
    });

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

    // Store code separately for each language
    const [codes, setCodes] = useState({
        python: "",
        go: "",
        javascript: "",
    });

    const [code, setCode] = useState("");
    const [score, setScore] = useState("");

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

    useEffect(() => {
        if (!id || !mounted) return;

        loadDriverCode(language);
    }, [language]);

    useEffect(() => {
        setCode(codes[language]);
    }, [codes, language]);
    async function loadQuestion() {
        try {
            const res = await api.get(`/problem/${id}`);

            setTitle(res.data.title);
            setDescription(res.data.description);
            setSampleInput(res.data.input);
            setSampleOutput(res.data.output);

            await loadDriverCode(language);
        } catch (err) {
            console.log(err);
            setConsoleText("Failed to load problem.");
        }
    }

    async function loadDriverCode(lang) {
        try {
            // Already loaded for this language
            if (codes[lang] !== "") {
                setCode(codes[lang]);
                return;
            }

            const res = await api.post("/driver", {
                qid: Number(id),
                language: lang,
            });

            const driverCode = res.data.code || "";

            setCodes((prev) => ({
                ...prev,
                [lang]: driverCode,
            }));

            setCode(driverCode);
        } catch (err) {
            console.log(err);
            setConsoleText("Failed to load driver code.");
        }
    }

    async function runCode() {
        try {
            setRunning(true);

            const res = await api.post("/run", {
                qid: Number(id),
                language: language,
                code: code,
                token: Cookies.get("token"),
            });

            const data = res.data;

            // Clear previous score by default
            setScore("");

            if (data.compile_error) {
                setConsoleText(data.compile_error);
            } else {
                if (
                    typeof data.score !== "undefined" &&
                    typeof data.total !== "undefined"
                ) {
                    setScore(`Score: ${data.score}/${data.total}`);
                }

                setConsoleText(data.error || "");
            }
        } catch (err) {
            console.log(err);

            const data = err.response?.data;

            setScore("");

            if (data?.compile_error) {
                setConsoleText(data.compile_error);
            } else if (data?.error) {
                if (
                    typeof data.score !== "undefined" &&
                    typeof data.total !== "undefined"
                ) {
                    setScore(`Score: ${data.score}/${data.total}`);
                }

                setConsoleText(data.error);
            } else {
                setConsoleText("Failed to connect to backend.");
            }
        } finally {
            setRunning(false);
        }
    }

    async function submitCode() {
        try {
            setSubmitting(true);

            const res = await api.post("/submit", {
                qid: Number(id),
                language: language,
                code: code,
            });

            setConsoleText(
                typeof res.data === "string"
                    ? res.data
                    : JSON.stringify(res.data, null, 2),
            );
        } catch (err) {
            console.log(err);

            setConsoleText(
                err.response?.data?.message ||
                    "An error occurred while submitting.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function submitTestcase() {
        try {
            setTestcaseSubmitting(true);

            const res = await api.post("/testcase", {
                qid: Number(id),
                input: testcaseInput,
                output: testcaseOutput,
                token: Cookies.get("token"),
            });

            if (res.data.created) {
                setPopup({
                    success: true,
                    message: "Test case contributed successfully!",
                });

                setShowTestcaseForm(false);
                setTestcaseInput("");
                setTestcaseOutput("");
            } else {
                setPopup({
                    success: false,
                    message:
                        "Incorrect test case. Please verify your input/output.",
                });
            }

            setPopupOpen(true);
        } catch (err) {
            setPopup({
                success: false,
                message: "Failed to connect to server.",
            });

            setPopupOpen(true);
        } finally {
            setTestcaseSubmitting(false);
        }
    }

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

                    <hr />

                    <button
                        className="nes-btn is-primary"
                        style={{
                            marginTop: "20px",
                        }}
                        onClick={() => setShowTestcaseForm(!showTestcaseForm)}
                    >
                        {showTestcaseForm ? "Cancel" : "Contribute Test Case"}
                    </button>

                    {showTestcaseForm && (
                        <div
                            className="nes-container is-rounded"
                            style={{
                                marginTop: "25px",
                            }}
                        >
                            <h3 className="nes-text is-success">
                                Contribute Test Case
                            </h3>

                            <div
                                className="nes-field"
                                style={{
                                    marginTop: "20px",
                                }}
                            >
                                <label>Sample Input</label>

                                <textarea
                                    className="nes-textarea is-dark"
                                    rows={6}
                                    value={testcaseInput}
                                    onChange={(e) =>
                                        setTestcaseInput(e.target.value)
                                    }
                                />
                            </div>

                            <div
                                className="nes-field"
                                style={{
                                    marginTop: "20px",
                                }}
                            >
                                <label>Sample Output</label>

                                <textarea
                                    className="nes-textarea is-dark"
                                    rows={6}
                                    value={testcaseOutput}
                                    onChange={(e) =>
                                        setTestcaseOutput(e.target.value)
                                    }
                                />
                            </div>

                            <button
                                className="nes-btn is-success"
                                style={{
                                    marginTop: "25px",
                                }}
                                onClick={submitTestcase}
                                disabled={testcaseSubmitting}
                            >
                                {testcaseSubmitting
                                    ? "Submitting..."
                                    : "Submit Test Case"}
                            </button>
                        </div>
                    )}
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
                            onChange={(value) => {
                                const newCode = value || "";

                                setCode(newCode);

                                setCodes((prev) => ({
                                    ...prev,
                                    [language]: newCode,
                                }));
                            }}
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
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "25px",
                            }}
                        >
                            <h3 className="nes-text is-warning">Console</h3>

                            <span className="nes-text is-success">{score}</span>
                        </div>

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
