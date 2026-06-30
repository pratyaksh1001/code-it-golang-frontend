export default function Home() {
    const boxes = [
        { top: "8%", left: "10%" },
        { top: "15%", left: "75%" },
        { top: "72%", left: "12%" },
        { top: "75%", left: "70%" },
        { top: "42%", left: "4%" },
        { top: "35%", left: "87%" },
        { top: "5%", left: "45%" },
        { top: "85%", left: "45%" },
    ];

    return (
        <main className="pixel-grid">
            {boxes.map((box, i) => (
                <div
                    key={i}
                    className="floating-box nes-container is-dark"
                    style={{
                        top: box.top,
                        left: box.left,
                        animationDelay: `${i * 0.5}s`,
                    }}
                />
            ))}

            <div className="center-button">
                <button className="nes-btn is-success glow">JUMP IN</button>
            </div>
        </main>
    );
}
