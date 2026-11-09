import { useState, useEffect, useRef, lazy, Suspense } from "react";
import About from "./components/About";
import Monologue from "./components/Monologue";
import Projects from "./components/Projects";
import Art from "./components/Art";
import NavBar from "./components/NavBar";
import CursorGlow from "./components/CursorGlow";
import ProjectDetail from "./components/ProjectDetail";
import NotFound from "./components/NotFound";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

// three.js only ships with the home page, so the other pages stay light
const CrayonWorld = lazy(() => import("./components/CrayonWorld"));

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

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

// HashRouter owns the URL hash, so a plain "#main-content" link would
// navigate to a route. Move focus to the page's <main> instead.
function skipToContent(e) {
    e.preventDefault();
    const main = document.getElementById("main-content");
    if (!main) return;
    main.setAttribute("tabindex", "-1");
    main.focus();
}

function App() {
    const { pathname } = useLocation();
    const isHome = pathname === "/";
    const [theme, setTheme] = useState(
        () =>
            localStorage.getItem("theme") ||
            (window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"),
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

    // the home page is the crayon world: it brings its own intro and nav
    if (isHome) {
        return (
            <Suspense fallback={<div className="crayon-loading" aria-hidden="true" />}>
                <CrayonWorld />
            </Suspense>
        );
    }

    return (
        <>
            <ScrollToTop />
            <a
                className="skip-link"
                href="#main-content"
                onClick={skipToContent}
            >
                Skip to content
            </a>
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
                <Route path="/about" element={<About />} />
                <Route path="/monologue" element={<Monologue />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/work/:slug" element={<ProjectDetail />} />
                <Route path="/art" element={<Art />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
}

export default App;
