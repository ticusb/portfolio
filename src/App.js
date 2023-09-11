import './App.css';
import Home from './components/Home'
import NavBar from './components/NavBar';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  return (
        <>
        <NavBar />
            <BrowserRouter>
                <Routes>
                     <Route path='/' exact element={<Home />} />
                </Routes>
            </BrowserRouter>
        </>
  );
}

export default App;
