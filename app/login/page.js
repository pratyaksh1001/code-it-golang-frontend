"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/api";

export default function Login() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    const boxes = [
        { top: "8%", left: "8%" },
        { top: "12%", left: "78%" },
        { top: "78%", left: "10%" },
        { top: "75%", left: "75%" },
        { top: "45%", left: "5%" },
        { top: "35%", left: "88%" },
        { top: "10%", left: "42%" },
        { top: "82%", left: "45%" },
    ];

    const handleLogin = async () => {
        setMessage("");

        if (!email.trim() || !password.trim()) {
            setMessage("Please fill all fields.");
            setMessageType("error");
            return;
        }

        setLoading(true);

        try {
            const { data } = await api.post("/login", {
                email,
                password,
            });

            if (data.exists) {
                Cookies.set("token", data.token, {
                    expires: 7,
                    sameSite: "Strict",
                });

                Cookies.set("username", data.username, {
                    expires: 7,
                    sameSite: "Strict",
                });

                setMessage("Login Successful!");
                setMessageType("success");

                setTimeout(() => {
                    router.push("/home");
                }, 1000);
            } else {
                setMessage("Invalid email or password.");
                setMessageType("error");
            }
        } catch (error) {
            console.error(error);

            setMessage(
                error.response?.data?.detail ||
                    "Unable to connect to the server.",
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main
            className="pixel-grid"
            style={{
                position: "relative",
                width: "100vw",
                height: "100vh",
            }}
        >
            {boxes.map((box, i) => (
                <div
                    key={i}
                    className="floating-box nes-container is-dark"
                    style={{
                        position: "absolute",
                        width: "120px",
                        height: "80px",
                        top: box.top,
                        left: box.left,
                        opacity: 0.65,
                        animationDelay: `${i * 0.5}s`,
                    }}
                />
            ))}

            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 100,
                }}
            >
                <div
                    className="nes-container is-dark with-title"
                    style={{
                        width: "460px",
                        maxWidth: "90vw",
                        padding: "30px",
                    }}
                >
                    <p
                        className="title"
                        style={{ textAlign: "center", color: "#00ff88" }}
                    >
                        PLAYER LOGIN
                    </p>

                    <div className="nes-field" style={{ marginBottom: "20px" }}>
                        <label>Email</label>
                        <input
                            type="email"
                            className="nes-input is-dark"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="nes-field" style={{ marginBottom: "20px" }}>
                        <label>Password</label>
                        <input
                            type="password"
                            className="nes-input is-dark"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {message && (
                        <p
                            className={`nes-text ${
                                messageType === "success"
                                    ? "is-success"
                                    : "is-error"
                            }`}
                            style={{
                                textAlign: "center",
                                marginBottom: "20px",
                            }}
                        >
                            {message}
                        </p>
                    )}

                    <button
                        className="nes-btn is-primary glow"
                        style={{ width: "100%" }}
                        disabled={loading}
                        onClick={handleLogin}
                    >
                        {loading ? "LOGGING IN..." : "LOGIN"}
                    </button>

                    <p
                        style={{
                            textAlign: "center",
                            marginTop: "20px",
                            fontSize: "10px",
                        }}
                    >
                        New here?
                        <br />
                        <Link
                            href="/register"
                            className="nes-text is-success"
                            style={{ textDecoration: "none" }}
                        >
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
