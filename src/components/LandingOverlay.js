import { useState, useEffect, useRef, Fragment } from "react";
import "./LandingOverlay.css";

const MESSAGES = [
    "Hello.",
    "Glad you could make it in one piece.",
    "Enjoy my page.",
];

const TYPE_SPEED = 80;
const LINE_PAUSE = 800;
const END_PAUSE = 1500;
const EXIT_FADE_MS = 750;

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
).matches;

function LandingOverlay({ onDone }) {
    const [completed, setCompleted] = useState(reducedMotion ? MESSAGES : []);
    const [current, setCurrent] = useState("");
    const [msgIndex, setMsgIndex] = useState(0);
    const [allDone, setAllDone] = useState(reducedMotion);
    const [exiting, setExiting] = useState(false);
    const [pieceEgg, setPieceEgg] = useState(false);
    const onDoneRef = useRef(onDone);
    const skipRef = useRef(null);

    useEffect(() => {
        onDoneRef.current = onDone;
    });

    useEffect(() => {
        skipRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!exiting) return;
        const t = setTimeout(() => onDoneRef.current(), EXIT_FADE_MS);
        return () => clearTimeout(t);
    }, [exiting]);

    useEffect(() => {
        if (!allDone) return;
        const t = setTimeout(
            () => setExiting(true),
            reducedMotion ? 800 : END_PAUSE,
        );
        return () => clearTimeout(t);
    }, [allDone]);

    useEffect(() => {
        if (!pieceEgg) return;
        const t = setTimeout(() => setPieceEgg(false), 2400);
        return () => clearTimeout(t);
    }, [pieceEgg]);

    useEffect(() => {
        if (reducedMotion || exiting || allDone) return;
        const msg = MESSAGES[msgIndex];

        if (current.length < msg.length) {
            const t = setTimeout(
                () => setCurrent(msg.slice(0, current.length + 1)),
                TYPE_SPEED,
            );
            return () => clearTimeout(t);
        }

        const t = setTimeout(() => {
            setCompleted((prev) => [...prev, msg]);
            if (msgIndex < MESSAGES.length - 1) {
                setCurrent("");
                setMsgIndex((i) => i + 1);
            } else {
                setAllDone(true);
            }
        }, LINE_PAUSE);

        return () => clearTimeout(t);
    }, [current, msgIndex, exiting, allDone]);

    const dismiss = () => !exiting && setExiting(true);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
            e.preventDefault();
            dismiss();
        }
    };

    const renderCompletedLine = (line, i) => {
        if (i !== 1) return line;
        const idx = line.indexOf("one piece");
        if (idx === -1) return line;
        return (
            <>
                {line.slice(0, idx)}
                <span
                    className="lo-piece"
                    role="button"
                    tabIndex="0"
                    onClick={(e) => {
                        e.stopPropagation();
                        !pieceEgg && setPieceEgg(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            !pieceEgg && setPieceEgg(true);
                        }
                    }}
                >
                    {line.slice(idx, idx + 9)}
                </span>
                {line.slice(idx + 9)}
            </>
        );
    };

    return (
        <div
            className={`lo${exiting ? " lo--exit" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Site intro"
            onClick={dismiss}
        >
            <div className="lo-terminal" onClick={(e) => e.stopPropagation()}>
                <div className="lo-header">
                    <span className="lo-domain">ticusb.com</span>
                    <span className="lo-shell">&nbsp;~&nbsp;%</span>
                </div>
                <div className="lo-divider" />

                <div className="lo-lines">
                    {completed.map((line, i) => (
                        <Fragment key={line}>
                            <div className="lo-line lo-line--done">
                                <span className="lo-prompt" aria-hidden="true">
                                    &gt;
                                </span>
                                <span>{renderCompletedLine(line, i)}</span>
                            </div>
                            {i === 1 && pieceEgg && (
                                <div className="lo-line lo-line--egg">
                                    <span
                                        className="lo-prompt"
                                        aria-hidden="true"
                                    >
                                        !
                                    </span>
                                    <span>THE ONE PIECE IS REAL!! 🏴‍☠️</span>
                                </div>
                            )}
                        </Fragment>
                    ))}

                    {!allDone && (
                        <div className="lo-line">
                            <span className="lo-prompt" aria-hidden="true">
                                &gt;
                            </span>
                            <span>{current}</span>
                            <span className="lo-cursor" aria-hidden="true" />
                        </div>
                    )}

                    {allDone && (
                        <div className="lo-line">
                            <span className="lo-prompt" aria-hidden="true">
                                &gt;
                            </span>
                            <span className="lo-cursor" aria-hidden="true" />
                        </div>
                    )}
                </div>
            </div>

            <button
                ref={skipRef}
                className="lo-skip-btn"
                onClick={dismiss}
                onKeyDown={handleKeyDown}
                aria-label="Skip intro"
            >
                <span aria-hidden="true">click to skip</span>
            </button>
        </div>
    );
}

export default LandingOverlay;
