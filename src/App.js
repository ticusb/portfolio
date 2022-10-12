import Home from "./components/Home.js";
import Navbar from "./components/Navbar";
import About from "./components/About.js";
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar/>
      <Home />
      <About />
    </div>
  );
}

export default App;
