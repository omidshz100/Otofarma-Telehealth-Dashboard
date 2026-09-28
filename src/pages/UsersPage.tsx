import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteUser, users, type DeviceUser } from '../api'
import { CopyButton, PageHeader, initials } from '../layout'

export function UsersPage() {
  const [rows, setRows] = useState<DeviceUser[]>([])
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    users()
      .then(setRows)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Could not load users'))
  }, [])

  const roles = useMemo(() => [...new Set(rows.map((user) => user.role).filter(Boolean))], [rows])
  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    return rows.filter((user) => {
      const matchesText = !text || `${user.name} ${user.gmail}`.toLowerCase().includes(text)
      const matchesRole = role === 'all' || user.role === role
      return matchesText && matchesRole
    })
  }, [rows, query, role])

  async function remove(user: DeviceUser) {
    if (!window.confirm(`Delete ${user.name} and everything assigned to them?`)) return
    try {
      await deleteUser(user.id)
      setRows((current) => current.filter((item) => item.id !== user.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete the user')
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        text="Device accounts for the companion app. There is still only one dashboard administrator."
        action={<Link className="primary" to="/users/new" style={{ display: 'grid', placeItems: 'center' }}>+ Add user</Link>}
      />
      {error ? <p className="banner">{error}</p> : null}
      <div className="toolbar">
        <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users by name or email" />
        <select className="select" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="all">Role: All</option>
          {roles.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <section className="card table">
        <div className="table-row users-row table-head">
          <span>User</span><span>Role</span><span>Apps</span><span>Notices</span><span>Actions</span>
        </div>
        {visible.map((user) => {
          const installed = user.apps.filter((app) => app.installed).length
          return (
            <div className="table-row users-row" key={user.id}>
              <div className="person">
                <div className="avatar">{initials(user.name)}</div>
                <div>
                  <strong>{user.name}</strong>
                  <small>{user.gmail}</small>
                </div>
              </div>
              <span>{user.role}</span>
              <span>{installed} of {user.apps.length} installed</span>
              <span>{user.notifications.length}</span>
              <span className="actions">
                {user.gmail ? <CopyButton value={user.gmail} /> : null}
                <Link className="ghost" to={`/users/${user.id}`} style={{ display: 'grid', placeItems: 'center' }}>Edit</Link>
                <button className="danger" type="button" onClick={() => void remove(user)}>Delete</button>
              </span>
            </div>
          )
        })}
        {visible.length === 0 ? <p className="quiet">No users match.</p> : null}
      </section>
    </>
  )
}
