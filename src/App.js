import './App.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/css/main.min.css';
import Home from './components/Home';
import Grouse from './components/Grouse';
import NavBar from './components/NavBar';
import {Routes, Route } from "react-router-dom";


function App() {
  return (
        <>
            <NavBar />
            <Routes>
                    <Route path='/' exact element={<Home />} />
                    <Route path='/grouse' exact element={<Grouse />} />
            </Routes>
        </>
  );
}

export default App;
