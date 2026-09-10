import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { getConfig } from './api'
import CmdK from './components/CmdK'

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `relative rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
    isActive
      ? 'bg-white/[0.06] text-[--fg]'
      : 'text-[--fg-3] hover:text-[--fg] hover:bg-white/[0.03]'
  }`

export default function App() {
  const nav = useNavigate()
  const loc = useLocation()
  useEffect(() => {
    const c = getConfig()
    if (!c && loc.pathname !== '/settings') nav('/settings', { replace: true })
  }, [loc.pathname, nav])

  return (
    <div className="dot-grid min-h-screen text-[--fg]">
      <header className="sticky top-0 z-30 border-b border-[--border] bg-[--bg-elevated]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 md:px-6">
          <NavLink to="/" className="flex items-center gap-2.5">
            <span
              className="relative inline-block h-2 w-2 rounded-full bg-[--accent-blue]"
              style={{ boxShadow: '0 0 10px 2px rgba(75,160,250,0.55)' }}
            />
            <span className="text-[15px] font-semibold tracking-tight">supermemory</span>
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-[--fg-4] md:inline">
              dashboard
            </span>
          </NavLink>
          <div className="flex items-center gap-1">
            <nav className="hidden items-center gap-1 md:flex">
              <NavLink to="/" end className={linkCls}>memories</NavLink>
              <NavLink to="/graph" className={linkCls}>graph</NavLink>
              <NavLink to="/search" className={linkCls}>search</NavLink>
              <NavLink to="/add" className={linkCls}>add</NavLink>
              <NavLink to="/settings" className={linkCls}>settings</NavLink>
            </nav>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="ml-2 flex items-center gap-2 rounded-md border border-[--border] bg-[--input] px-2.5 py-1.5 text-[12px] text-[--fg-3] transition-colors hover:text-[--fg]"
              aria-label="Open command palette"
            >
              <span className="hidden sm:inline">Search</span>
              <span className="mono rounded border border-[--border] px-1 py-0.5 text-[10px]">⌘K</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6">
        <Outlet />
      </main>
      <CmdK />
    </div>
  )
}
