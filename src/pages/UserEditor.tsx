import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apps, createUser, updateUser, users, when, type CatalogApp, type DeviceUser } from '../api'
import { CopyButton, PageHeader } from '../layout'

export function UserEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState<CatalogApp[]>([])
  const [person, setPerson] = useState<DeviceUser | null>(null)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [gmail, setGmail] = useState('')
  const [gmailPassword, setGmailPassword] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([apps(), id ? users() : Promise.resolve([] as DeviceUser[])])
      .then(([appRows, userRows]) => {
        if (!alive) return
        setCatalog(appRows)
        if (!id) return
        const found = userRows.find((user) => user.id === id)
        if (!found) {
          setError('User not found')
          return
        }
        setPerson(found)
        setName(found.name)
        setRole(found.role)
        setGmail(found.gmail)
        setGmailPassword(found.gmail_password ?? '')
        setAppPassword(found.app_password ?? '')
        setSelected(found.apps.map((app) => app.id))
      })
      .catch((caught) => {
        if (alive) setError(caught instanceof Error ? caught.message : 'Could not load the user')
      })
    return () => {
      alive = false
    }
  }, [id])

  function toggle(appId: string) {
    setSelected((current) => (current.includes(appId) ? current.filter((item) => item !== appId) : [...current, appId]))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setNote(null)
    try {
      if (!id) {
        const created = await createUser({
          name: name.trim(),
          role: role.trim(),
          gmail: gmail.trim(),
          gmail_password: gmailPassword,
          app_password: appPassword,
          app_ids: selected,
        })
        navigate(`/users/${created.id}`, { replace: true })
        return
      }
      const body: Record<string, unknown> = {
        name: name.trim(),
        role: role.trim(),
        gmail: gmail.trim(),
        app_ids: selected,
      }
      if (gmailPassword && gmailPassword !== person?.gmail_password) body.gmail_password = gmailPassword
      if (appPassword && appPassword !== person?.app_password) body.app_password = appPassword
      const updated = await updateUser(id, body)
      setPerson(updated)
      setGmailPassword(updated.gmail_password ?? '')
      setAppPassword(updated.app_password ?? '')
      setNote('User saved')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the user')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title={id ? name || 'User' : 'Add user'}
        text="The role is a label. The checkbox list decides which apps this person sees."
        action={<Link className="ghost" to="/">Dashboard</Link>}
      />
      {error ? <p className="banner">{error}</p> : null}
      {note ? <p className="ok-note">{note}</p> : null}
      <form className="form" onSubmit={submit}>
        <div className="row-2">
          <label className="field"><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label className="field"><span>Role label</span><input value={role} onChange={(event) => setRole(event.target.value)} required /></label>
        </div>
        <label className="field">
          <span>Gmail address</span>
          <span className="secret">
            <input value={gmail} onChange={(event) => setGmail(event.target.value)} type="email" required />
            {gmail ? <CopyButton value={gmail} /> : null}
          </span>
        </label>
        <label className="field">
          <span>Gmail password</span>
          <span className="secret">
            <input value={gmailPassword} onChange={(event) => setGmailPassword(event.target.value)} minLength={id && !gmailPassword ? undefined : 8} required={!id} />
            {gmailPassword ? <CopyButton value={gmailPassword} /> : null}
          </span>
          <p className="quiet">Stored copy for the tablet. Changing it here does not change the Google account. The user can change this copy in the app.</p>
        </label>
        <label className="field">
          <span>App password</span>
          <span className="secret">
            <input
              value={appPassword}
              onChange={(event) => setAppPassword(event.target.value)}
              type="text"
              minLength={id && !appPassword ? undefined : 8}
              required={!id}
              placeholder={id && !person?.app_password ? 'Set a new app password' : ''}
            />
            {appPassword ? <CopyButton value={appPassword} /> : null}
          </span>
          <p className="quiet">This is the Otofarma sign-in password. You and the user can both see and change it.</p>
        </label>
        <div className="field">
          <span>Assigned apps</span>
          <div className="checks">
            {catalog.map((app) => (
              <label className="check" key={app.id}>
                <input type="checkbox" checked={selected.includes(app.id)} onChange={() => toggle(app.id)} />
                <span>
                  <b>{app.name}</b>
                  <small>{app.package_name}</small>
                </span>
              </label>
            ))}
            {catalog.length === 0 ? <p className="quiet">Create an application first.</p> : null}
          </div>
        </div>
        <button className="primary" type="submit" disabled={busy}>{id ? 'Save user' : 'Create user'}</button>
      </form>

      {person ? (
        <>
          <h2 className="section-title">Install status</h2>
          <section className="card table">
            {person.apps.map((app) => (
              <div className="status-row" key={app.id}>
                <div className="status-main">
                  <strong>{app.name}</strong>
                  <span>{app.package_name}</span>
                </div>
                <span className={app.installed ? 'chip ok' : 'chip'}>{app.installed ? 'Installed' : 'Not installed'}</span>
                <span>{app.installed_version || when(app.reported_at)}</span>
              </div>
            ))}
            {person.apps.length === 0 ? <p className="quiet">No apps assigned.</p> : null}
          </section>
          <h2 className="section-title">Notifications</h2>
          <section className="card card-pad">
            {person.notifications.map((item) => (
              <div className="activity" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
                <span className="muted">{when(item.created_at)}</span>
              </div>
            ))}
            {person.notifications.length === 0 ? <p className="quiet">No notifications yet.</p> : null}
          </section>
        </>
      ) : null}
    </>
  )
}
