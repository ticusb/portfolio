import Home from "./components/Home.js";
import NavBar from "./components/NavBar.js";
import About from "./components/About.js";
import './App.css';

function App() {
  return (
    <div className="App">
      <NavBar/>
      <Home />
      <About />
    </div>
  );
}

export default App;
