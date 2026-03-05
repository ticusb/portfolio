import { useState, useEffect, useRef } from "react";
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

function LandingOverlay({ onDone }) {
    const [completed, setCompleted] = useState([]);
    const [current, setCurrent] = useState("");
    const [msgIndex, setMsgIndex] = useState(0);
    const [allDone, setAllDone] = useState(false);
    const [exiting, setExiting] = useState(false);
    const [pieceEgg, setPieceEgg] = useState(false);
    const onDoneRef = useRef(onDone);

    useEffect(() => {
        onDoneRef.current = onDone;
    });

    useEffect(() => {
        if (!exiting) return;
        const t = setTimeout(() => onDoneRef.current(), EXIT_FADE_MS);
        return () => clearTimeout(t);
    }, [exiting]);

    useEffect(() => {
        if (!allDone) return;
        const t = setTimeout(() => setExiting(true), END_PAUSE);
        return () => clearTimeout(t);
    }, [allDone]);

    useEffect(() => {
        if (!pieceEgg) return;
        const t = setTimeout(() => setPieceEgg(false), 2400);
        return () => clearTimeout(t);
    }, [pieceEgg]);

    useEffect(() => {
        if (exiting || allDone) return;
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

    const renderCompletedLine = (line, i) => {
        if (i !== 1) return line;
        const idx = line.indexOf("one piece");
        if (idx === -1) return line;
        return (
            <>
                {line.slice(0, idx)}
                <span
                    className="lo-piece"
                    onClick={(e) => {
                        e.stopPropagation();
                        !pieceEgg && setPieceEgg(true);
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
            onClick={() => !exiting && setExiting(true)}
            role="presentation"
        >
            <div className="lo-terminal" onClick={(e) => e.stopPropagation()}>
                <div className="lo-header">
                    <span className="lo-domain">ticusb.com</span>
                    <span className="lo-shell">&nbsp;~&nbsp;%</span>
                </div>
                <div className="lo-divider" />

                <div className="lo-lines">
                    {completed.map((line, i) => (
                        <div className="lo-line lo-line--done" key={i}>
                            <span className="lo-prompt" aria-hidden="true">
                                &gt;
                            </span>
                            <span>{renderCompletedLine(line, i)}</span>
                        </div>
                    ))}

                    {pieceEgg && (
                        <div className="lo-line lo-line--egg">
                            <span className="lo-prompt" aria-hidden="true">
                                !
                            </span>
                            <span>THE ONE PIECE IS REAL!! 🏴‍☠️</span>
                        </div>
                    )}

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

            <span className="lo-skip">click to skip</span>
        </div>
    );
}

export default LandingOverlay;
