import { Link } from "react-router-dom";
import "./NotFound.css";

// anything that isn't part of the world
function NotFound() {
    return (
        <main className="lost" id="main-content">
            <p className="lost-code">404</p>
            <h1>this page fell off the mountain.</h1>
            <p>Nothing lives at this address. The drawing is still where you left it.</p>
            <Link to="/">back to the drawing &rarr;</Link>
        </main>
    );
}

export default NotFound;
