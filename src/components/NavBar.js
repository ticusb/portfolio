import React from 'react';

function NavBar(props) {
    return (
        <>
            <nav class="navbar bg-primary navbar-expand-lg">
                <div class="container-fluid">
                    <a class="navbar-brand" href="/">Tucus</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
                    <div class="navbar-nav">
                        <a class="nav-link active" aria-current="page" href="/">Home</a>
                        <a class="nav-link" href="/projects">Projects</a>
                        <a class="nav-link" href="/grouse">Grouse</a>
                    </div>
                    </div>
                </div>
            </nav>
        </>
    )
}

export default NavBar;