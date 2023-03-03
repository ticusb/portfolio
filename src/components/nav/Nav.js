import './Nav.css';

function Nav(props) {
    return (
        <div class="navbar">
            <div class="nav-icon">
                <p>Ticus</p>
            </div>
            <div class="nav-links">
                <div class="nav-item">
                    <a href="#">Home</a>
                </div>
                <div class="nav-item">
                    <a href="#">Projects</a>
                </div>
                <div class="nav-item">
                    <a href="#">Contact</a>
                </div>
            </div>
        </div>
    );
}

export default Nav;