import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';

function NavBar() {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
            <Link to="/" className="nav-brand">lb</Link>
            <ul className="nav-links">
                <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>home</Link></li>
                <li><Link to="/projects" className={location.pathname === '/projects' ? 'active' : ''}>projects</Link></li>
            </ul>
        </nav>
    );
}

export default NavBar;
