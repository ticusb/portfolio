import { useState, useEffect } from 'react';
import Home from './components/Home';
import Projects from './components/Projects';
import NavBar from './components/NavBar';
import CursorGlow from './components/CursorGlow';
import LandingOverlay from './components/LandingOverlay';
import { Routes, Route } from "react-router-dom";

const DEFAULT_ACCENT = '#16a34a';

function App() {
    const [overlayDone, setOverlayDone] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [accent, setAccent] = useState(() => localStorage.getItem('accent') || DEFAULT_ACCENT);

    const toggleTheme = () => {
        document.documentElement.classList.add('theme-transition');
        setTheme(t => t === 'light' ? 'dark' : 'light');
        setTimeout(() => document.documentElement.classList.remove('theme-transition'), 400);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.style.setProperty('--accent', accent);
        localStorage.setItem('accent', accent);
    }, [accent]);

    return (
        <>
            {!overlayDone && <LandingOverlay onDone={() => setOverlayDone(true)} />}
            <CursorGlow />
            <NavBar theme={theme} toggleTheme={toggleTheme} accent={accent} setAccent={setAccent} />
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/projects' element={<Projects />} />
            </Routes>
        </>
    );
}

export default App;
