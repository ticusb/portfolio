import { useState, useEffect, useRef } from 'react';
import './LandingOverlay.css';

const MESSAGES = [
    'Hello.',
    'Glad you could make it in one piece.',
    'Enjoy the page.',
];

const TYPE_SPEED    = 38;   // ms per character
const PAUSE_AFTER   = 950;  // ms to hold each completed message
const TEXT_FADE_MS  = 180;  // ms to fade text out between messages
const OVERLAY_EXIT  = 680;  // ms for the overlay fade

function LandingOverlay({ onDone }) {
    const [msgIndex,   setMsgIndex]   = useState(0);
    const [displayed,  setDisplayed]  = useState('');
    const [textFading, setTextFading] = useState(false);
    const [exiting,    setExiting]    = useState(false);
    const onDoneRef = useRef(onDone);

    useEffect(() => { onDoneRef.current = onDone; });

    // call onDone after the overlay CSS transition finishes
    useEffect(() => {
        if (!exiting) return;
        const t = setTimeout(() => onDoneRef.current(), OVERLAY_EXIT);
        return () => clearTimeout(t);
    }, [exiting]);

    // typewriter
    useEffect(() => {
        if (exiting) return;
        const msg = MESSAGES[msgIndex];

        if (displayed.length < msg.length) {
            const t = setTimeout(
                () => setDisplayed(msg.slice(0, displayed.length + 1)),
                TYPE_SPEED
            );
            return () => clearTimeout(t);
        }

        // fully typed — pause, then advance or exit
        const t = setTimeout(() => {
            if (msgIndex < MESSAGES.length - 1) {
                setTextFading(true);
                setTimeout(() => {
                    setDisplayed('');
                    setTextFading(false);
                    setMsgIndex(i => i + 1);
                }, TEXT_FADE_MS);
            } else {
                setExiting(true);
            }
        }, PAUSE_AFTER);

        return () => clearTimeout(t);
    }, [displayed, msgIndex, exiting]);

    return (
        <div
            className={`lo${exiting ? ' lo--exit' : ''}`}
            onClick={() => !exiting && setExiting(true)}
            role="presentation"
        >
            <p className={`lo-text${textFading ? ' lo-text--fade' : ''}`}>
                <span>{displayed}</span>
                {!textFading && <span className="lo-cursor" aria-hidden="true" />}
            </p>
            <span className="lo-skip">click to skip</span>
        </div>
    );
}

export default LandingOverlay;
