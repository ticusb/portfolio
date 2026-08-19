import "./Art.css";

// Points at the deployed gallery unless REACT_APP_ART_URL overrides it, so a
// local run can embed a local this-is-art instead of the live one.
const ART_URL = process.env.REACT_APP_ART_URL || "https://art.ticusb.com";

function Art() {
    return (
        <main className="art-page">
            <iframe
                src={ART_URL}
                title="this-is-art — interactive art gallery"
                className="art-frame"
                allow="fullscreen"
            />
        </main>
    );
}

export default Art;
