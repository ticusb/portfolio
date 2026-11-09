import { lazy, Suspense } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import NotFound from "./components/NotFound";
import "./App.css";

// the whole site is the crayon world (three.js loads with it)
const CrayonWorld = lazy(() => import("./components/CrayonWorld"));

// every section lives in the world; these routes just deep-link into one, so old links still land somewhere
function World({ section }) {
    const { slug } = useParams();
    return (
        <Suspense fallback={<div className="crayon-loading" aria-hidden="true" />}>
            <CrayonWorld section={section} project={slug} />
        </Suspense>
    );
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
