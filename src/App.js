import './App.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/css/main.min.css';
import Home from './components/Home'
import NavBar from './components/NavBar';
import { HashRouter, Routes, Route } from "react-router-dom";


function App() {
  return (
        <>
        <NavBar />
            <HashRouter>
                <Routes>
                     <Route path='/' exact element={<Home />} />
                     <Route path='/grouse' exact element={<Home />} />
                </Routes>
            </HashRouter>
        </>
  );
}

export default App;
