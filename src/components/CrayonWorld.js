import { useEffect, useRef } from "react";
import MARKUP from "../crayon/markup";
import { mountCrayonWorld } from "../crayon/engine";
import "../crayon/crayon.css";

// The home page: a crayon drawing that plays a short intro, then shows the nav inside the world.
// The markup is static and owned by the engine after mount, so React renders it once and stays out of the way.
function CrayonWorld() {
    const ref = useRef(null);

    useEffect(() => {
        const unmount = mountCrayonWorld(ref.current);
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
