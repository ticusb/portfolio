import "./Art.css";

const ART_URL = "https://art.ticusb.com";

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
