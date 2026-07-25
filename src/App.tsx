import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Maintenance from './pages/Maintenance'
import Reminders from './pages/Reminders'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 font-medium ${isActive ? 'text-toyota-red border-b-2 border-toyota-red' : 'text-toyota-gray hover:text-toyota-black'}`

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-toyota-black py-4">DriveIQ</h1>
          <nav className="flex gap-2">
            <NavLink to="/" end className={navLinkClass}>Vehicle</NavLink>
            <NavLink to="/maintenance" className={navLinkClass}>Maintenance</NavLink>
            <NavLink to="/reminders" className={navLinkClass}>Reminders</NavLink>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/reminders" element={<Reminders />} />
        </Routes>
      </main>
    </div>
  )
}
