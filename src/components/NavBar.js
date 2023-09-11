import React from 'react';

function NavBar(props) {
    return (
        <nav className="navbar navbar-expand-lg mb-3">
            <div className="container-fluid">
                <a className="navbar-brand" href="/">Tucus</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
                    <div className="navbar-nav">
                        <a className="nav-link active" aria-current="page" href="/">Home</a>
                        <a className="nav-link" href="/projects">Projects</a>
                        <a className="nav-link" href="/grouse">Grouse</a>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default NavBar;