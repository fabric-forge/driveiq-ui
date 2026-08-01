import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Car, Wrench, Bell, Sparkles } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Maintenance from './pages/Maintenance'
import Reminders from './pages/Reminders'
import Aiana from './pages/Aiana'

const navItems = [
  { path: '/', label: 'Vehicle', icon: Car },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench },
  { path: '/reminders', label: 'Reminders', icon: Bell },
  { path: '/aiana', label: 'Aiana', icon: Sparkles },
]

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-toyota-black text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Car className="h-8 w-8 text-toyota-red" />
              <span className="text-xl font-bold">DriveIQ</span>
            </Link>
            <div className="flex gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    location.pathname === path
                      ? 'bg-toyota-red text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/aiana" element={<Aiana />} />
        </Routes>
      </main>
    </div>
  )
}
