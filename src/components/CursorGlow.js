import { useEffect, useRef } from "react";
import "./CursorGlow.css";

function CursorGlow() {
    const ref = useRef(null);

    useEffect(() => {
        const move = (e) => {
            if (ref.current) {
                ref.current.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
            }
        };
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}

export default CursorGlow;
