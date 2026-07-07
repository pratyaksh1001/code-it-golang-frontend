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
    const [runtime, setRuntime] = useState("");

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

            const endpoint = `/run_${language}`;

            const res = await api.post(endpoint, {
                qid: Number(id),
                language,
                code,
                token: Cookies.get("token"),
            });

            const data = res.data;

            setScore("");
            setRuntime("");

            if (
                typeof data.score !== "undefined" &&
                typeof data.total !== "undefined"
            ) {
                setScore(`Score: ${data.score}/${data.total}`);
            }

            if (typeof data.time_taken !== "undefined") {
                setRuntime(`${data.time_taken}`);
            }

            if (data.compile_error) {
                setConsoleText(data.compile_error);
            } else if (data.error) {
                setConsoleText(data.error);
            } else {
                setConsoleText("");
            }
        } catch (err) {
            console.error(err);

            const data = err.response?.data;

            setScore("");
            setRuntime("");

            if (
                typeof data?.score !== "undefined" &&
                typeof data?.total !== "undefined"
            ) {
                setScore(`Score: ${data.score}/${data.total}`);
            }

            if (typeof data?.time_taken !== "undefined") {
                setRuntime(`${data.time_taken}`);
            }

            if (data?.compile_error) {
                setConsoleText(data.compile_error);
            } else if (data?.error) {
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

            const endpoint = `/run_${language}`;

            const res = await api.post(endpoint, {
                qid: Number(id),
                language,
                code,
                token: Cookies.get("token"),
                submission: true,
            });

            const data = res.data;

            setScore("");
            setRuntime("");

            if (
                typeof data.score !== "undefined" &&
                typeof data.total !== "undefined"
            ) {
                setScore(`Score: ${data.score}/${data.total}`);
            }

            if (typeof data.time_taken !== "undefined") {
                setRuntime(`${data.time_taken}`);
            }

            if (data.compile_error) {
                setConsoleText(data.compile_error);
            } else if (data.error) {
                setConsoleText(data.error);
            } else {
                setConsoleText("");
            }
        } catch (err) {
            console.error(err);

            const data = err.response?.data;

            setScore("");
            setRuntime("");

            if (
                typeof data?.score !== "undefined" &&
                typeof data?.total !== "undefined"
            ) {
                setScore(`Score: ${data.score}/${data.total}`);
            }

            if (typeof data?.time_taken !== "undefined") {
                setRuntime(`Runtime: ${data.time_taken} ms`);
            }

            if (data?.compile_error) {
                setConsoleText(data.compile_error);
            } else if (data?.error) {
                setConsoleText(data.error);
            } else {
                setConsoleText("Failed to connect to backend.");
            }
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
                padding: "14px",
                gap: "14px",
                overflow: "hidden",
                boxSizing: "border-box",
            }}
        >
            <nav
                className="nes-container is-dark"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 18px",
                    flexShrink: 0,
                }}
            >
                <h2
                    className="nes-text is-success"
                    style={{
                        margin: 0,
                        fontSize: "1.45rem",
                        letterSpacing: "1px",
                    }}
                >
                    CODE-IT
                </h2>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "24px",
                        fontSize: ".9rem",
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

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "35% 65%",
                    gap: "14px",
                    flex: 1,
                    overflow: "hidden",
                    minHeight: 0,
                }}
            >
                {/* LEFT PANEL */}

                <div
                    className="nes-container is-dark with-title"
                    style={{
                        padding: "22px",
                        overflowY: "auto",
                        overflowX: "hidden",
                        fontSize: ".92rem",
                    }}
                >
                    <p
                        className="title"
                        style={{
                            fontSize: ".9rem",
                        }}
                    ></p>

                    <h2
                        className="nes-text is-success"
                        style={{
                            marginBottom: "18px",
                            fontSize: "1.5rem",
                            lineHeight: "1.2",
                        }}
                    >
                        {title}
                    </h2>

                    <h3
                        className="nes-text is-primary"
                        style={{
                            fontSize: "1rem",
                            marginBottom: "8px",
                        }}
                    >
                        Description
                    </h3>

                    <p
                        style={{
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.55",
                            fontSize: ".92rem",
                            marginBottom: "12px",
                        }}
                    >
                        {description}
                    </p>

                    <hr
                        style={{
                            margin: "14px 0",
                        }}
                    />

                    <h3
                        className="nes-text is-warning"
                        style={{
                            fontSize: "1rem",
                            marginBottom: "8px",
                        }}
                    >
                        Sample Input
                    </h3>

                    <pre
                        style={{
                            whiteSpace: "pre-wrap",
                            fontSize: ".88rem",
                            lineHeight: "1.45",
                            margin: 0,
                        }}
                    >
                        {sampleInput}
                    </pre>

                    <hr
                        style={{
                            margin: "14px 0",
                        }}
                    />

                    <h3
                        className="nes-text is-error"
                        style={{
                            fontSize: "1rem",
                            marginBottom: "8px",
                        }}
                    >
                        Sample Output
                    </h3>

                    <pre
                        style={{
                            whiteSpace: "pre-wrap",
                            fontSize: ".88rem",
                            lineHeight: "1.45",
                            margin: 0,
                        }}
                    >
                        {sampleOutput}
                    </pre>

                    <hr
                        style={{
                            margin: "16px 0",
                        }}
                    />

                    <button
                        className="nes-btn is-primary"
                        style={{
                            marginTop: "6px",
                        }}
                        onClick={() => setShowTestcaseForm(!showTestcaseForm)}
                    >
                        {showTestcaseForm ? "Cancel" : "Contribute Test Case"}
                    </button>

                    {showTestcaseForm && (
                        <div
                            className="nes-container is-rounded"
                            style={{
                                marginTop: "18px",
                                padding: "18px",
                            }}
                        >
                            <h3
                                className="nes-text is-success"
                                style={{
                                    marginBottom: "12px",
                                    fontSize: "1rem",
                                }}
                            >
                                Contribute Test Case
                            </h3>

                            <div
                                className="nes-field"
                                style={{
                                    marginTop: "10px",
                                }}
                            >
                                <label>Sample Input</label>

                                <textarea
                                    className="nes-textarea is-dark"
                                    rows={5}
                                    value={testcaseInput}
                                    onChange={(e) =>
                                        setTestcaseInput(e.target.value)
                                    }
                                />
                            </div>

                            <div
                                className="nes-field"
                                style={{
                                    marginTop: "14px",
                                }}
                            >
                                <label>Sample Output</label>

                                <textarea
                                    className="nes-textarea is-dark"
                                    rows={5}
                                    value={testcaseOutput}
                                    onChange={(e) =>
                                        setTestcaseOutput(e.target.value)
                                    }
                                />
                            </div>

                            <button
                                className="nes-btn is-success"
                                style={{
                                    marginTop: "18px",
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
                        padding: "14px",
                        overflow: "hidden",
                        minHeight: 0,
                    }}
                >
                    <p
                        className="title"
                        style={{
                            fontSize: ".9rem",
                        }}
                    ></p>

                    {/* Toolbar */}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "10px",
                            flexWrap: "wrap",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
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
                                gap: "10px",
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

                    {/* EDITOR */}

                    <div
                        style={{
                            flex: 1,
                            minHeight: 0,
                            border: "3px solid white",
                            borderRadius: "6px",
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

                                fontSize: 15,

                                automaticLayout: true,

                                scrollBeyondLastLine: false,

                                wordWrap: "on",

                                roundedSelection: false,

                                smoothScrolling: true,

                                cursorBlinking: "smooth",

                                cursorSmoothCaretAnimation: "on",

                                renderLineHighlight: "all",

                                lineNumbersMinChars: 3,

                                glyphMargin: false,

                                folding: true,

                                bracketPairColorization: {
                                    enabled: true,
                                },

                                guides: {
                                    bracketPairs: true,
                                },

                                padding: {
                                    top: 10,
                                },
                            }}
                        />
                    </div>
                    {/* Console Header */}

                    <div
                        style={{
                            marginTop: "10px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            minHeight: "38px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "18px",
                                flexWrap: "nowrap",
                            }}
                        >
                            <span
                                className="nes-text is-warning"
                                style={{
                                    fontSize: ".98rem",
                                    fontWeight: 700,
                                }}
                            >
                                Console
                            </span>

                            <span
                                className="nes-text is-success"
                                style={{
                                    fontSize: ".88rem",
                                }}
                            >
                                Score:
                                <span
                                    style={{
                                        marginLeft: "6px",
                                    }}
                                >
                                    {score}
                                </span>
                            </span>

                            <span
                                className="nes-text is-primary"
                                style={{
                                    fontSize: ".88rem",
                                }}
                            >
                                <span
                                    style={{
                                        marginLeft: "6px",
                                    }}
                                >
                                    {runtime} ms
                                </span>
                            </span>
                        </div>

                        <button
                            className="nes-btn is-primary"
                            style={{
                                padding: "4px 12px",
                            }}
                            onClick={() => setConsoleOpen(!consoleOpen)}
                        >
                            {consoleOpen ? "Hide" : "Show"}
                        </button>
                    </div>

                    {/* Console */}

                    <div
                        style={{
                            marginTop: "10px",
                            height: consoleOpen ? "145px" : "0px",
                            overflow: "hidden",
                            transition: "height .25s ease",
                        }}
                    >
                        <div
                            className="nes-container is-dark"
                            style={{
                                height: "145px",
                                overflowY: "auto",
                                overflowX: "hidden",
                                padding: "14px",
                            }}
                        >
                            <pre
                                style={{
                                    margin: 0,
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    fontFamily: "monospace",
                                    fontSize: ".84rem",
                                    lineHeight: "1.45",
                                }}
                            >
                                {consoleText}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
