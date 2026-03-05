import { useEffect, useRef } from 'react';
import './CursorGlow.css';

function CursorGlow() {
    const ref = useRef(null);

    useEffect(() => {
        const move = e => {
            if (ref.current) {
                ref.current.style.left = `${e.clientX}px`;
                ref.current.style.top = `${e.clientY}px`;
            }
        };
        window.addEventListener('mousemove', move);
        return () => window.removeEventListener('mousemove', move);
    }, []);

    return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}

export default CursorGlow;
