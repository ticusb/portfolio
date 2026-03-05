import Home from './components/Home';
import Projects from './components/Projects';
import NavBar from './components/NavBar';
import { Routes, Route } from "react-router-dom";

function App() {
    return (
        <>
            <NavBar />
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/projects' element={<Projects />} />
            </Routes>
        </>
    );
}

export default App;
