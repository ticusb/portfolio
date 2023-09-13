import React from 'react';
import { Link } from 'react-router-dom';

function NavBar(props) {
    return (
        <nav className="navbar navbar-light bg-transparent navbar-expand-lg mb-3">
            <div className="container-fluid">
                <a className="navbar-brand" href="/">Tucus</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse justify-content-end " id="navbarNavAltMarkup">
                    <ul className="navbar-nav">
                        <li className='nav-item'>
                            <Link className="nav-link active" aria-current="page" to="/">Home</Link>
                        </li>
                        <li className='nav-item'>
                            <Link className="nav-link" to="/projects">Projects</Link>
                        </li>
                        <li className='nav-item'>
                            <Link className="nav-link" to="/grouse">Grouse</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}

export default NavBar;