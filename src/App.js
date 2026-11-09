import { Routes, Route, useParams } from "react-router-dom";
import CrayonWorld from "./components/CrayonWorld";
import NotFound from "./components/NotFound";

// the whole site is the crayon world, so three.js ships in the main bundle: lazy-loading it only added a second
// round trip (main.js, then the world's chunk) before anything could draw

// every section lives in the world; these routes just deep-link into one, so old links still land somewhere
function World({ section }) {
    const { slug } = useParams();
    return <CrayonWorld section={section} project={slug} />;
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<World />} />
            <Route path="/about" element={<World section="about" />} />
            <Route path="/projects" element={<World section="projects" />} />
            <Route path="/work/:slug" element={<World section="projects" />} />
            <Route path="/monologue" element={<World section="monologue" />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;
