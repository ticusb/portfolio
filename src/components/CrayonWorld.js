import { useEffect, useRef } from "react";
import MARKUP from "../crayon/markup";
import { mountCrayonWorld } from "../crayon/engine";
import "../crayon/crayon.css";

// The site: a crayon drawing that plays a short intro, then shows the nav inside the world.
// The markup is static and owned by the engine after mount, so React renders it once and stays out of the way.
// section/project come from the URL on first load (#/about, #/work/v1-ready) and open that part of the world.
function CrayonWorld({ section, project }) {
    const ref = useRef(null);
    const deepLink = useRef({ section, project });

    useEffect(() => {
        const unmount = mountCrayonWorld(ref.current, deepLink.current);
        return unmount;
    }, []);

    return (
        <div
            className="crayon-root"
            ref={ref}
            dangerouslySetInnerHTML={{ __html: MARKUP }}
        />
    );
}

export default CrayonWorld;
