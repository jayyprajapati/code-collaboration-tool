import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Login from './pages/login';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';

function App() {
  return (
    <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/editor/:sessionId" element={<EditorPage />} />
    </Routes>
  </Router>
  )
}

export default App
