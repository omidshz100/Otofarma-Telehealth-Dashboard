import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clearToken, me, type Me } from './api'

export function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Me | null>(null)

  useEffect(() => {
    let alive = true
    me()
      .then((value) => {
        if (!alive) return
        if (value.kind !== 'admin') {
          clearToken()
          navigate('/login', { replace: true })
          return
        }
        setProfile(value)
      })
      .catch(() => {
        if (alive) navigate('/login', { replace: true })
      })
    return () => {
      alive = false
    }
  }, [navigate])

  function signOut() {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Otofarma</div>
        <div className="brand-sub">Admin Console</div>
        <NavLink className={({ isActive }) => (isActive ? 'nav active' : 'nav')} to="/" end>
          Dashboard
        </NavLink>
        <NavLink className={({ isActive }) => (isActive ? 'nav active' : 'nav')} to="/apps">
          Applications
        </NavLink>
        <NavLink className={({ isActive }) => (isActive ? 'nav active' : 'nav')} to="/users">
          Users
        </NavLink>
        <div className="aside-foot">
          <strong>{profile?.name || 'Admin'}</strong>
          <span>{profile?.email || 'Otofarma'}</span>
          <button className="linkish" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}

export function PageHeader({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </header>
  )
}

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="ghost"
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1200)
        })
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U'
}
