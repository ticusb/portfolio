import { useState, useEffect, useRef } from 'react';
import './LandingOverlay.css';

const MESSAGES = [
    'Hello.',
    'Glad you could make it in one piece.',
    'Enjoy my page.',
];

const TYPE_SPEED   = 80;    // ms per character
const LINE_PAUSE   = 800;   // ms to hold after each completed line
const END_PAUSE    = 1500;  // ms to hold the final blinking cursor
const EXIT_FADE_MS = 750;   // ms for the overlay fade out

function LandingOverlay({ onDone }) {
    const [completed,  setCompleted]  = useState([]);
    const [current,    setCurrent]    = useState('');
    const [msgIndex,   setMsgIndex]   = useState(0);
    const [allDone,    setAllDone]    = useState(false);
    const [exiting,    setExiting]    = useState(false);
    const onDoneRef = useRef(onDone);

    useEffect(() => { onDoneRef.current = onDone; });

    // once exiting, wait for CSS fade then unmount
    useEffect(() => {
        if (!exiting) return;
        const t = setTimeout(() => onDoneRef.current(), EXIT_FADE_MS);
        return () => clearTimeout(t);
    }, [exiting]);

    // hold the final cursor before fading
    useEffect(() => {
        if (!allDone) return;
        const t = setTimeout(() => setExiting(true), END_PAUSE);
        return () => clearTimeout(t);
    }, [allDone]);

    // typewriter
    useEffect(() => {
        if (exiting || allDone) return;
        const msg = MESSAGES[msgIndex];

        if (current.length < msg.length) {
            const t = setTimeout(
                () => setCurrent(msg.slice(0, current.length + 1)),
                TYPE_SPEED
            );
            return () => clearTimeout(t);
        }

        // line fully typed — pause, then advance
        const t = setTimeout(() => {
            setCompleted(prev => [...prev, msg]);
            if (msgIndex < MESSAGES.length - 1) {
                setCurrent('');
                setMsgIndex(i => i + 1);
            } else {
                setAllDone(true);
            }
        }, LINE_PAUSE);

        return () => clearTimeout(t);
    }, [current, msgIndex, exiting, allDone]);

    return (
        <div
            className={`lo${exiting ? ' lo--exit' : ''}`}
            onClick={() => !exiting && setExiting(true)}
            role="presentation"
        >
            <div className="lo-terminal">
                <div className="lo-header">
                    <span className="lo-domain">ticusb.com</span>
                    <span className="lo-shell">&nbsp;~&nbsp;%</span>
                </div>
                <div className="lo-divider" />

                <div className="lo-lines">
                    {completed.map((line, i) => (
                        <div className="lo-line lo-line--done" key={i}>
                            <span className="lo-prompt" aria-hidden="true">&gt;</span>
                            <span>{line}</span>
                        </div>
                    ))}

                    {/* active typing line */}
                    {!allDone && (
                        <div className="lo-line">
                            <span className="lo-prompt" aria-hidden="true">&gt;</span>
                            <span>{current}</span>
                            <span className="lo-cursor" aria-hidden="true" />
                        </div>
                    )}

                    {/* idle cursor after all messages */}
                    {allDone && (
                        <div className="lo-line">
                            <span className="lo-prompt" aria-hidden="true">&gt;</span>
                            <span className="lo-cursor" aria-hidden="true" />
                        </div>
                    )}
                </div>
            </div>

            <span className="lo-skip">click to skip</span>
        </div>
    );
}

export default LandingOverlay;
