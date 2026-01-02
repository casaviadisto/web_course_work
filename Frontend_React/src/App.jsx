import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';

import Home from './pages/Home';
import LiveControl from './pages/LiveControl';
import Astronauts from './pages/Astronauts';
import Expeditions from './pages/Expeditions';
import Tracker from './ISSTracker/Tracker.jsx';
import Map from './ISSTracker/Map.jsx';
import AstronautDetail from './pages/AstronautDetail'

function Navigation() {
    const location = useLocation();

    const hiddenPaths = ['/ISSTracker/map', '/ISSTracker/tracker'];

    if (hiddenPaths.includes(location.pathname)) {
        return null;
    }

    return (
        <nav className="navbar">
            <Link to="/" className="nav-logo">
                ISS Tracker
            </Link>

            <div className="nav-links">
                <Link to="/" className="nav-item">Головна</Link>
                <Link to="/live" className="nav-item">LiveControl</Link>
                <Link to="/astronauts" className="nav-item">Астронавти</Link>
                <Link to="/expeditions" className="nav-item">Експедиції</Link>
                {/*<Link to="/ISSTracker/tracker" className="nav-item">Tracker</Link>*/}
                {/*<Link to="/ISSTracker/map" className="nav-item">Map</Link>*/}
            </div>
        </nav>
    );
}

function App() {
    return (
        <Router>
            <div className="app-container">

                <Navigation />

                <div className="content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/live" element={<LiveControl />} />
                        <Route path="/astronauts" element={<Astronauts />} />
                        <Route path="/expeditions" element={<Expeditions />} />
                        <Route path="/ISSTracker/tracker" element={<Tracker />} />
                        <Route path="/ISSTracker/map" element={<Map />} />
                        <Route path="/astronauts/:id" element={<AstronautDetail />} />
                    </Routes>
                </div>

            </div>
        </Router>
    );
}

export default App;