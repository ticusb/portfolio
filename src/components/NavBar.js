import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClickOutside } from "../hooks/useClickOutside";
import "./NavBar.css";

const PRESETS = [
    "#16a34a",
    "#2563eb",
    "#e11d48",
    "#d97706",
    "#7c3aed",
    "#0891b2",
];

function NavBar({ theme, toggleTheme, accent, setAccent }) {
    const [scrolled, setScrolled] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const location = useLocation();
    const pickerRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const closePicker = useCallback(() => setPickerOpen(false), []);
    useClickOutside(pickerRef, closePicker);

    // /art is a fixed, full-bleed iframe, so the document never scrolls and the
    // nav would stay transparent forever — sitting unreadable on top of the
    // gallery photos. Give that route the solid treatment from the start.
    const solid = scrolled || location.pathname === "/art";

    return (
        <nav className={`nav${solid ? " nav--scrolled" : ""}`}>
            <Link to="/" className="nav-brand">
                lb
            </Link>
            <div className="nav-right">
                <ul className="nav-links" role="list">
                    <li>
                        <Link
                            to="/"
                            className={
                                location.pathname === "/" ? "active" : ""
                            }
                        >
                            home
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/projects"
                            className={
                                location.pathname === "/projects"
                                    ? "active"
                                    : ""
                            }
                        >
                            projects
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/art"
                            className={
                                location.pathname === "/art" ? "active" : ""
                            }
                        >
                            art
                        </Link>
                    </li>
                </ul>
                <div className="nav-controls">
                    <button
                        className="theme-btn"
                        onClick={toggleTheme}
                        aria-label={
                            theme === "light"
                                ? "Switch to dark mode"
                                : "Switch to light mode"
                        }
                        title={theme === "light" ? "Dark mode" : "Light mode"}
                    >
                        {theme === "light" ? "◐" : "◑"}
                    </button>
                    <div className="picker-wrap" ref={pickerRef}>
                        <button
                            className="accent-btn"
                            style={{ background: accent }}
                            onClick={() => setPickerOpen((o) => !o)}
                            aria-label="Change accent color"
                            title="Change accent color"
                        />
                        {pickerOpen && (
                            <div className="picker-popover">
                                <p className="picker-heading">accent</p>
                                <div className="picker-presets">
                                    {PRESETS.map((c) => (
                                        <button
                                            key={c}
                                            className={`swatch${accent === c ? " swatch--active" : ""}`}
                                            style={{ background: c }}
                                            onClick={() => {
                                                setAccent(c);
                                                setPickerOpen(false);
                                            }}
                                            aria-label={`Set accent to ${c}`}
                                        />
                                    ))}
                                </div>
                                <label className="picker-custom">
                                    <span>custom</span>
                                    <input
                                        type="color"
                                        value={accent}
                                        onChange={(e) =>
                                            setAccent(e.target.value)
                                        }
                                        className="picker-wheel"
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default NavBar;
