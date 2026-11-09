import { Link } from "react-router-dom";
import "./TextPage.css";

// Placeholder until the first post exists.
function Monologue() {
    return (
        <main className="text-page" id="main-content">
            <h1>monologue</h1>
            <p className="text-page-lede">Nothing here yet.</p>
            <p className="text-page-back">
                <Link to="/">&larr; back to the drawing</Link>
            </p>
        </main>
    );
}

export default Monologue;
