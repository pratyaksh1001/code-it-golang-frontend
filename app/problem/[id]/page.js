"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Cookies from "js-cookie";
import { useParams } from "next/navigation";
import api from "@/api";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const EDITOR_OPTIONS = {
    minimap: { enabled: false },
    fontSize: 15,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: "on",
    smoothScrolling: true,
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    renderLineHighlight: "all",
    lineNumbersMinChars: 3,
    glyphMargin: false,
    folding: true,
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true },
    padding: { top: 10 },
};

// Keys that never touch content, so they're always allowed regardless of cursor position.
const NAV_KEYS = new Set([
    "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
    "Home", "End", "PageUp", "PageDown", "Escape",
    "Shift", "Control", "Alt", "Meta",
]);
// Ctrl/Cmd combos that only read (copy, select-all, find) - safe even over locked text.
const ALLOWED_CTRL_KEYS = new Set(["a", "A", "c", "C", "f", "F"]);

/** Builds the full source shown in the editor: fixed imports, editable signature, fixed main. */
function composeSource(imports, signature, main) {
    const prefix = imports ? `${imports}\n\n` : "";
    const suffix = main ? `\n\n${main}` : "";
    return `${prefix}${signature}${suffix}`;
}

const NAV_LINKS = [
    { href: "/home", label: "Home", cls: "is-primary" },
    { href: "/question_list", label: "Problems", cls: "is-warning" },
    { href: "/contests", label: "Contests", cls: "is-success" },
    { href: "/leaderboard", label: "Leaderboard", cls: "is-error" },
];

function useResizer({ axis, initial, min, max }) {
    const [size, setSize] = useState(initial);
    const containerRef = useRef(null);

    const move = useCallback((e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pct =
            axis === "x"
                ? ((e.clientX - rect.left) / rect.width) * 100
                : ((e.clientY - rect.top) / rect.height) * 100;
        setSize(Math.min(max, Math.max(min, pct)));
    }, [axis, min, max]);

    const stop = useCallback((e) => {
        try {
            e.target.releasePointerCapture?.(e.pointerId);
        } catch {
            // pointer may already be released - safe to ignore
        }
        document.body.classList.remove("resizing-x", "resizing-y");
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
    }, [move]);

    const start = useCallback((e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        document.body.classList.add(axis === "x" ? "resizing-x" : "resizing-y");
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", stop);
    }, [axis, move, stop]);

    // Clean up listeners if the component unmounts mid-drag.
    useEffect(() => {
        return () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", stop);
        };
    }, [move, stop]);

    return { size, containerRef, start };
}

export default function ProblemPage() {
    const { id } = useParams();

    const [mounted, setMounted] = useState(false);
    const [username, setUsername] = useState("Player");

    const [problem, setProblem] = useState({ title: "", description: "", input: "", output: "" });

    const [language, setLanguage] = useState("python");
    const [theme, setTheme] = useState("vs-dark");
    const [driver, setDriver] = useState({
        python: { imports: "", signature: "", main: "", loaded: false },
        go: { imports: "", signature: "", main: "", loaded: false },
    });

    const editorRef = useRef(null);
    const lockRef = useRef({ prefix: "", suffix: "" });
    const lastGoodRef = useRef("");
    const lastCursorOffsetRef = useRef(0);

    const [result, setResult] = useState({ score: "", runtime: "", console: "Run your code to see output..." });
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [testcase, setTestcase] = useState({ open: false, input: "", output: "", submitting: false });
    const [popup, setPopup] = useState({ open: false, success: false, message: "" });

    const split = useResizer({ axis: "x", initial: 35, min: 22, max: 60 });
    const vsplit = useResizer({ axis: "y", initial: 68, min: 40, max: 85 });

    useEffect(() => {
        if (!id) return;
        setMounted(true);
        setUsername(Cookies.get("username") || "Player");
        api.get(`/problem/${id}`)
            .then((res) =>
                setProblem({
                    title: res.data.title,
                    description: res.data.description,
                    input: res.data.input,
                    output: res.data.output,
                }),
            )
            .catch(() => setResult((r) => ({ ...r, console: "Failed to load problem." })));
    }, [id]);

    useEffect(() => {
        if (!id || !mounted) return;
        loadDriverCode(language);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language, mounted]);

    async function loadDriverCode(lang) {
        if (driver[lang].loaded) return;
        try {
            const res = await api.post("/driver", { qid: Number(id), language: lang });
            setDriver((prev) => ({
                ...prev,
                [lang]: {
                    imports: res.data.imports || "",
                    signature: res.data.func_signature || "",
                    main: res.data.main || "",
                    loaded: true,
                },
            }));
        } catch {
            setResult((r) => ({ ...r, console: "Failed to load driver code." }));
        }
    }

    /**
     * Shows exactly what the backend sent back - never a canned "passed/failed"
     * message. Score/runtime still surface separately in the console header.
     */
    function applyRunResult(data) {
        if (!data) {
            setResult({ score: "", runtime: "", console: "Failed to connect to backend." });
            return;
        }
        const output = data.error ?? data.output ?? data.stdout ?? data.console ?? "";
        setResult({
            score: data.score !== undefined && data.total !== undefined ? `Score: ${data.score}/${data.total}` : "",
            runtime: data.time_taken !== undefined ? `${data.time_taken}` : "",
            console: output || "(no output)",
        });
    }

    async function execute(isSubmission) {
        const setBusy = isSubmission ? setSubmitting : setRunning;
        setBusy(true);
        try {
            const { imports, signature, main } = driver[language];
            const code = composeSource(imports, signature, main);

            const res = await api.post(`/run_${language}`, {
                qid: Number(id),
                language,
                code,
                token: Cookies.get("token"),
                ...(isSubmission && { submission: true }),
            });
            applyRunResult(res.data);
        } catch (err) {
            applyRunResult(err.response?.data ?? null);
        } finally {
            setBusy(false);
        }
    }

    /** Runs once when the editor for a language mounts: wires up the locked-region guard. */
    function handleEditorMount(editor, monaco, lang) {
        editorRef.current = editor;

        const { imports, main } = driver[lang];
        const prefix = imports ? `${imports}\n\n` : "";
        const suffix = main ? `\n\n${main}` : "";
        lockRef.current = { prefix, suffix };
        lastGoodRef.current = editor.getValue();
        lastCursorOffsetRef.current = prefix.length;

        const model = editor.getModel();
        const totalLines = model.getLineCount();
        const importsLines = imports ? imports.split("\n").length : 0;
        const mainLines = main ? main.split("\n").length : 0;
        const decorations = [];
        if (importsLines > 0) {
            decorations.push({
                range: new monaco.Range(1, 1, importsLines, 1),
                options: { isWholeLine: true, className: "locked-line", linesDecorationsClassName: "locked-gutter" },
            });
        }
        if (mainLines > 0) {
            decorations.push({
                range: new monaco.Range(totalLines - mainLines + 1, 1, totalLines, 1),
                options: { isWholeLine: true, className: "locked-line", linesDecorationsClassName: "locked-gutter" },
            });
        }
        editor.deltaDecorations([], decorations);

        editor.onKeyDown((e) => guardKeydown(e, editor));
        editor.onDidChangeModelContent(() => guardContentChange(editor, lang));

        editor.setPosition(model.getPositionAt(prefix.length));
        editor.focus();
    }

    /** Blocks keystrokes whose selection touches the locked imports/main text. */
    function guardKeydown(e, editor) {
        const key = e.browserEvent.key;
        if (NAV_KEYS.has(key)) return;
        if ((e.browserEvent.ctrlKey || e.browserEvent.metaKey) && ALLOWED_CTRL_KEYS.has(key)) return;

        const model = editor.getModel();
        const value = model.getValue();
        const { prefix, suffix } = lockRef.current;
        const editableStart = prefix.length;
        const editableEnd = value.length - suffix.length;

        const sel = editor.getSelection();
        const startOffset = model.getOffsetAt(sel.getStartPosition());
        const endOffset = model.getOffsetAt(sel.getEndPosition());

        if (startOffset < editableStart || endOffset > editableEnd) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Collapsed-cursor edge case the range check above misses entirely:
        // Backspace right at editableStart deletes the last char of the
        // locked prefix; Delete right at editableEnd deletes the first char
        // of the locked suffix. Neither moves startOffset/endOffset outside
        // the editable range before the key fires, so both slipped through.
        if (sel.isEmpty()) {
            if (key === "Backspace" && startOffset <= editableStart) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            if (key === "Delete" && startOffset >= editableEnd) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }
    }

    /** Safety net: if an edit slipped past the keydown guard (paste, drag, IME), revert it. */
    function guardContentChange(editor, lang) {
        const model = editor.getModel();
        const value = model.getValue();
        const { prefix, suffix } = lockRef.current;
        const valid = value.length >= prefix.length + suffix.length && value.startsWith(prefix) && value.endsWith(suffix);

        if (!valid) {
            const good = lastGoodRef.current;
            editor.setValue(good);
            const pos = model.getPositionAt(Math.min(lastCursorOffsetRef.current, good.length));
            editor.setPosition(pos);
            editor.revealPositionInCenterIfOutsideViewport(pos);
            return;
        }

        lastGoodRef.current = value;
        lastCursorOffsetRef.current = model.getOffsetAt(editor.getSelection().getPosition());

        const signature = value.slice(prefix.length, value.length - suffix.length);
        setDriver((prev) => ({ ...prev, [lang]: { ...prev[lang], signature } }));
    }

    async function submitTestcase() {
        setTestcase((t) => ({ ...t, submitting: true }));
        try {
            const res = await api.post("/testcase", {
                qid: Number(id),
                input: testcase.input,
                output: testcase.output,
                token: Cookies.get("token"),
            });
            if (res.data.created) {
                setPopup({ open: true, success: true, message: "Test case contributed successfully!" });
                setTestcase({ open: false, input: "", output: "", submitting: false });
                return;
            }
            setPopup({ open: true, success: false, message: "Incorrect test case. Please verify your input/output." });
        } catch {
            setPopup({ open: true, success: false, message: "Failed to connect to server." });
        } finally {
            setTestcase((t) => ({ ...t, submitting: false }));
        }
    }

    if (!mounted) return null;

    return (
        <main className="pixel-grid page">
            <nav className="nes-container is-dark navbar">
                <h2 className="nes-text is-success brand">CODE-IT</h2>

                <div className="nav-links">
                    {NAV_LINKS.map((l) => (
                        <Link key={l.href} href={l.href} className={`nes-text ${l.cls}`}>
                            {l.label}
                        </Link>
                    ))}
                </div>

                <Link href="/profile">
                    <button className="nes-btn is-primary">{username}</button>
                </Link>
            </nav>

            <div className="layout" ref={split.containerRef} style={{ gridTemplateColumns: `${split.size}% 6px 1fr` }}>
                {/* LEFT: PROBLEM */}
                <section className="nes-container is-dark panel panel-left">
                    <h2 className="nes-text is-success problem-title">{problem.title}</h2>

                    <h3 className="nes-text is-primary section-label">Description</h3>
                    <p className="body-text">{problem.description}</p>

                    <hr />

                    <h3 className="nes-text is-warning section-label">Sample Input</h3>
                    <pre className="sample-block">{problem.input}</pre>

                    <hr />

                    <h3 className="nes-text is-error section-label">Sample Output</h3>
                    <pre className="sample-block">{problem.output}</pre>

                    <hr />

                    <button
                        className="nes-btn is-primary"
                        onClick={() => setTestcase((t) => ({ ...t, open: !t.open }))}
                    >
                        {testcase.open ? "Cancel" : "Contribute Test Case"}
                    </button>

                    {testcase.open && (
                        <div className="nes-container is-rounded testcase-form">
                            <h3 className="nes-text is-success section-label">Contribute Test Case</h3>

                            <div className="nes-field">
                                <label>Sample Input</label>
                                <textarea
                                    className="nes-textarea is-dark"
                                    rows={5}
                                    value={testcase.input}
                                    onChange={(e) => setTestcase((t) => ({ ...t, input: e.target.value }))}
                                />
                            </div>

                            <div className="nes-field mt">
                                <label>Sample Output</label>
                                <textarea
                                    className="nes-textarea is-dark"
                                    rows={5}
                                    value={testcase.output}
                                    onChange={(e) => setTestcase((t) => ({ ...t, output: e.target.value }))}
                                />
                            </div>

                            <button
                                className="nes-btn is-success mt"
                                onClick={submitTestcase}
                                disabled={testcase.submitting}
                            >
                                {testcase.submitting ? "Submitting..." : "Submit Test Case"}
                            </button>
                        </div>
                    )}
                </section>

                {/* DRAG HANDLE (horizontal split, left/right) */}
                <div
                    className="divider divider-x"
                    onPointerDown={split.start}
                    role="separator"
                    aria-orientation="vertical"
                />

                {/* RIGHT: EDITOR */}
                <section className="nes-container is-dark panel panel-right">
                    <div className="toolbar-row">
                        <div className="toolbar-selects">
                            <div className="nes-select is-dark">
                                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                                    <option value="python">Python</option>
                                    <option value="go">Go</option>
                                </select>
                            </div>

                            <div className="nes-select is-dark">
                                <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                                    <option value="vs-dark">VS Dark</option>
                                    <option value="light">Light</option>
                                    <option value="hc-black">High Contrast</option>
                                </select>
                            </div>
                        </div>

                        <div className="toolbar-actions">
                            <button className="nes-btn is-warning" disabled={running} onClick={() => execute(false)}>
                                {running ? "Running..." : "Run"}
                            </button>
                            <button className="nes-btn is-success" disabled={submitting} onClick={() => execute(true)}>
                                {submitting ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>

                    {/* Everything below is now correctly contained inside vsplit's ref,
                        so the vertical resize measures the right box. */}
                    <div className="editor-console-layout" ref={vsplit.containerRef}>
                        <div className="editor-frame" style={{ height: `${vsplit.size}%` }}>
                            {driver[language].loaded ? (
                                <Editor
                                    key={language}
                                    language={language}
                                    theme={theme}
                                    defaultValue={composeSource(
                                        driver[language].imports,
                                        driver[language].signature,
                                        driver[language].main,
                                    )}
                                    onMount={(editor, monaco) => handleEditorMount(editor, monaco, language)}
                                    options={EDITOR_OPTIONS}
                                />
                            ) : (
                                <div className="editor-loading">Loading driver code...</div>
                            )}
                        </div>

                        {/* DRAG HANDLE (vertical split, editor/console) */}
                        <div
                            className="divider divider-y"
                            onPointerDown={vsplit.start}
                            role="separator"
                            aria-orientation="horizontal"
                        />

                        <div className="console-area" style={{ height: `${100 - vsplit.size}%` }}>
                            <div className="console-header">
                                <span className="nes-text is-warning console-label">Console</span>
                                {result.score && <span className="nes-text is-success">{result.score}</span>}
                                {result.runtime && <span className="nes-text is-primary">{result.runtime} ms</span>}
                            </div>

                            <div className="console-wrap">
                                <div className="nes-container is-dark console-body">
                                    <pre className="console-text">{result.console}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {popup.open && (
                <div className="popup-overlay" onClick={() => setPopup((p) => ({ ...p, open: false }))}>
                    <div
                        className={`nes-container is-rounded popup ${popup.success ? "is-success" : "is-error"}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p>{popup.message}</p>
                        <button className="nes-btn" onClick={() => setPopup((p) => ({ ...p, open: false }))}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .page {
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    padding: 10px;
                    gap: 10px;
                    overflow: hidden;
                    box-sizing: border-box;
                }
                .navbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 16px;
                    flex-shrink: 0;
                }
                .brand {
                    margin: 0;
                    font-size: 1.4rem;
                    letter-spacing: 1px;
                }
                .nav-links {
                    display: flex;
                    align-items: center;
                    gap: 22px;
                    font-size: 0.88rem;
                }
                .nav-links :global(a) {
                    text-decoration: none;
                    transition: opacity 0.15s ease, transform 0.15s ease;
                }
                .nav-links :global(a:hover) {
                    opacity: 0.75;
                    transform: translateY(-1px);
                }
                .layout {
                    display: grid;
                    gap: 0;
                    flex: 1;
                    overflow: hidden;
                    min-height: 0;
                }
                .panel {
                    padding: 16px;
                    overflow-y: auto;
                    overflow-x: hidden;
                    font-size: 0.92rem;
                    min-height: 0;
                }
                .panel :global(hr) {
                    margin: 10px 0;
                    border-color: rgba(255, 255, 255, 0.2);
                }
                .panel-right {
                    display: flex;
                    flex-direction: column;
                    padding: 12px;
                    overflow: hidden;
                }
                .problem-title {
                    margin-bottom: 14px;
                    font-size: 1.45rem;
                    line-height: 1.2;
                }
                .section-label {
                    font-size: 0.98rem;
                    margin-bottom: 6px;
                }
                .body-text {
                    white-space: pre-wrap;
                    line-height: 1.5;
                    font-size: 0.92rem;
                    margin-bottom: 8px;
                }
                .sample-block {
                    white-space: pre-wrap;
                    font-size: 0.88rem;
                    line-height: 1.4;
                    margin: 0;
                }
                .testcase-form {
                    margin-top: 14px;
                    padding: 14px;
                }
                .nes-field.mt {
                    margin-top: 12px;
                }
                .nes-btn.mt {
                    margin-top: 14px;
                }
                .divider {
                    touch-action: none;
                    flex-shrink: 0;
                }
                .divider-x {
                    cursor: col-resize;
                    background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.15), transparent);
                    transition: background 0.15s ease;
                }
                .divider-x:hover,
                :global(.resizing-x) .divider-x {
                    background: rgba(146, 204, 65, 0.5);
                }
                .divider-y {
                    height: 6px;
                    margin: 6px 0;
                    cursor: row-resize;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
                    transition: background 0.15s ease;
                }
                .divider-y:hover,
                :global(.resizing-y) .divider-y {
                    background: rgba(146, 204, 65, 0.5);
                }
                .toolbar-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                    flex-wrap: wrap;
                    flex-shrink: 0;
                }
                .toolbar-selects,
                .toolbar-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .editor-console-layout {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    min-height: 0;
                    overflow: hidden;
                }
                .editor-frame {
                    flex: none;
                    min-height: 0;
                    border: 3px solid white;
                    border-radius: 6px;
                    overflow: hidden;
                    position: relative;
                }
                .editor-loading {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 0.85rem;
                }
                :global(.locked-line) {
                    background: rgba(255, 255, 255, 0.045);
                }
                :global(.locked-gutter) {
                    border-left: 3px solid rgba(233, 105, 105, 0.55);
                }
                .console-area {
                    flex: none;
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                    overflow: hidden;
                }
                .console-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    min-height: 26px;
                    flex-shrink: 0;
                    font-size: 0.9rem;
                }
                .console-label {
                    font-weight: 700;
                }
                .console-wrap {
                    margin-top: 6px;
                    flex: 1;
                    min-height: 0;
                    overflow: hidden;
                }
                .console-body {
                    height: 100%;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 12px;
                    box-sizing: border-box;
                }
                .console-text {
                    margin: 0;
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-family: monospace;
                    font-size: 0.84rem;
                    line-height: 1.4;
                }
                .popup-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.55);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                }
                .popup {
                    max-width: 380px;
                    padding: 20px;
                    text-align: center;
                }
                :global(body.resizing-x) {
                    cursor: col-resize;
                    user-select: none;
                }
                :global(body.resizing-y) {
                    cursor: row-resize;
                    user-select: none;
                }
            `}</style>
        </main>
    );
}
