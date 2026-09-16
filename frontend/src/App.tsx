import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'
import LandingPage from './pages/LandingPage'
import SimulationPage from './pages/SimulationPage'
import RiskAnalysisPage from './pages/RiskAnalysisPage'
import ObjectsPage from './pages/ObjectsPage'
import MethodologyPage from './pages/MethodologyPage'
import { useSimulationStore } from './store/simulationStore'

export default function App() {
  const { sidebarOpen } = useSimulationStore()

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <Sidebar />
        <main className="flex-1 pt-14 transition-all duration-300 lg:ml-72">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/risk" element={<RiskAnalysisPage />} />
            <Route path="/objects" element={<ObjectsPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
          </Routes>
          <Footer />
        </main>
      </div>
    </BrowserRouter>
  )
}