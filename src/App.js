import './App.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/css/main.min.css';
import Home from './components/Home'
import NavBar from './components/NavBar';
import { BrowserRouter, Routes, Route } from "react-router-dom";


function App() {
  return (
        <>
        <NavBar />
            <BrowserRouter>
                <Routes>
                     <Route path='/' exact element={<Home />} />
                     <Route path='/grouse' exact element={<Home />} />
                </Routes>
            </BrowserRouter>
        </>
  );
}

export default App;
