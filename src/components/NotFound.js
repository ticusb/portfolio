import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
    return (
        <main className="not-found-page" id="main-content">
            <div className="not-found-content">
                <p className="not-found-code">404</p>
                <h1>That page is not here.</h1>
                <p>The address may be wrong, or the project may have moved.</p>
                <Link to="/projects">view the work &rarr;</Link>
            </div>
        </main>
    );
}

export default NotFound;
