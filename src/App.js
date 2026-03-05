import { useState, useEffect, useRef } from "react";
import Home from "./components/Home";
import Projects from "./components/Projects";
import NavBar from "./components/NavBar";
import CursorGlow from "./components/CursorGlow";
import LandingOverlay from "./components/LandingOverlay";
import { Routes, Route } from "react-router-dom";
import "./App.css";

const DEFAULT_ACCENT = "#16a34a";
const PARTY_COLORS = [
    "#16a34a",
    "#2563eb",
    "#e11d48",
    "#d97706",
    "#7c3aed",
    "#0891b2",
];
const KONAMI_SEQ = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
];

function App() {
    const [overlayDone, setOverlayDone] = useState(false);
    const [theme, setTheme] = useState(
        () => localStorage.getItem("theme") || "light",
    );
    const [accent, setAccent] = useState(
        () => localStorage.getItem("accent") || DEFAULT_ACCENT,
    );
    const [partyMode, setPartyMode] = useState(false);
    const konamiIdx = useRef(0);
    const accentRef = useRef(accent);

    useEffect(() => {
        accentRef.current = accent;
    }, [accent]);

    const toggleTheme = () => {
        document.documentElement.classList.add("theme-transition");
        setTheme((t) => (t === "light" ? "dark" : "light"));
        setTimeout(
            () => document.documentElement.classList.remove("theme-transition"),
            400,
        );
    };

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.style.setProperty("--accent", accent);
        localStorage.setItem("accent", accent);

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text x="16" y="24" font-family="monospace" font-weight="700" font-size="18" fill="${accent}" text-anchor="middle">lb</text></svg>`;
        const url = URL.createObjectURL(
            new Blob([svg], { type: "image/svg+xml" }),
        );
        const link = document.querySelector("link[rel='icon']");
        if (link) link.href = url;
        return () => URL.revokeObjectURL(url);
    }, [accent]);

    useEffect(() => {
        const activateParty = () => {
            if (partyMode) return;
            setPartyMode(true);
            let i = 0;
            const interval = setInterval(() => {
                document.documentElement.style.setProperty(
                    "--accent",
                    PARTY_COLORS[i % PARTY_COLORS.length],
                );
                i++;
            }, 180);
            setTimeout(() => {
                clearInterval(interval);
                document.documentElement.style.setProperty(
                    "--accent",
                    accentRef.current,
                );
                setPartyMode(false);
            }, 2000);
        };

        const onKey = (e) => {
            if (e.key === KONAMI_SEQ[konamiIdx.current]) {
                konamiIdx.current += 1;
                if (konamiIdx.current === KONAMI_SEQ.length) {
                    konamiIdx.current = 0;
                    activateParty();
                }
            } else {
                konamiIdx.current = e.key === KONAMI_SEQ[0] ? 1 : 0;
            }
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [partyMode]);

    return (
        <>
            {!overlayDone && (
                <LandingOverlay onDone={() => setOverlayDone(true)} />
            )}
            {partyMode && (
                <div className="party-toast">&gt; party mode: on</div>
            )}
            <CursorGlow />
            <NavBar
                theme={theme}
                toggleTheme={toggleTheme}
                accent={accent}
                setAccent={setAccent}
            />
            <Routes>
                <Route path="/" element={<Home overlayDone={overlayDone} />} />
                <Route path="/projects" element={<Projects />} />
            </Routes>
        </>
    );
}

export default App;
