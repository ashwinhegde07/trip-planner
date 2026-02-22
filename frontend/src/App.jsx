/**
 * App — Root component for the Trip Planner & ELD Log Generator.
 */
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import NewTrip from './components/NewTrip';
import MyTrips from './components/MyTrips';
import TripDetail from './components/TripDetail';

export default function App() {
  return (
    <div className="gradient-bg min-h-screen">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-surface-950/70 border-b border-surface-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-600/30">
                <span className="text-lg">🚛</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">Trip Planner</h1>
                <p className="text-[10px] text-surface-400 leading-tight">ELD Log Generator</p>
              </div>
            </Link>

            <div className="flex items-center gap-2 md:gap-6">
              <div className="flex bg-surface-800/60 p-1 rounded-xl">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-surface-600 text-white shadow' : 'text-surface-400 hover:text-white'}`
                  }
                >
                  New Trip
                </NavLink>
                <NavLink
                  to="/trips"
                  className={({ isActive }) =>
                    `px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-surface-600 text-white shadow' : 'text-surface-400 hover:text-white'}`
                  }
                >
                  My Trips
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<NewTrip />} />
          <Route path="/trips" element={<MyTrips />} />
          <Route path="/trip/:id" element={<TripDetail />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center gap-8 text-sm text-surface-400">
          <a href="https://www.linkedin.com/in/ashwin-hegde-912495257/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
            LinkedIn
          </a>
          <a href="https://github.com/ashwinhegde07" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
