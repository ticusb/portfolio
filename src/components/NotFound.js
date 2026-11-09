import { Link } from "react-router-dom";
import "./NotFound.css";

// which world you were in: the one you picked with the toggle, else the theme (dark = space), like the engine
function currentWorld() {
    try {
        const forced = localStorage.getItem("world");
        if (forced === "space" || forced === "ski") return forced;
    } catch (e) {
        /* private mode */
    }
    const dt = document.documentElement.getAttribute("data-theme");
    if (dt) return dt === "dark" ? "space" : "ski";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "space" : "ski";
}

// anything that isn't part of the world
function NotFound() {
    const space = currentWorld() === "space";
    return (
        <main className={space ? "lost night" : "lost"} id="main-content">
            <p className="lost-code">404</p>
            <h1>{space ? "this page drifted off into space." : "this page fell off the mountain."}</h1>
            <p>Nothing lives at this address. The drawing is still where you left it.</p>
            <Link to="/">back to the drawing &rarr;</Link>
        </main>
    );
}

export default NotFound;
