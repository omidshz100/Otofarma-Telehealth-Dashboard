import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apps, sourceLabel, summary, titleCase, users, when, type Activity, type CatalogApp, type DeviceUser } from '../api'
import { PageHeader } from '../layout'

export function Home() {
  const [error, setError] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<CatalogApp[]>([])
  const [people, setPeople] = useState<DeviceUser[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [counts, setCounts] = useState({ users: 0, apps: 0 })

  useEffect(() => {
    let alive = true
    Promise.all([summary(), apps(), users()])
      .then(([overview, appRows, userRows]) => {
        if (!alive) return
        setCounts({ users: overview.users, apps: overview.apps })
        setActivity(overview.activities)
        setCatalog(appRows)
        setPeople(userRows)
      })
      .catch((caught) => {
        if (alive) setError(caught instanceof Error ? caught.message : 'Could not load the dashboard')
      })
    return () => {
      alive = false
    }
  }, [])

  const published = catalog.filter((app) => app.guide_published).length
  const installed = people.reduce((total, person) => total + person.apps.filter((app) => app.installed).length, 0)

  return (
    <>
      <PageHeader
        title="Dashboard"
        text="Manage apps, users and guides from one place."
        action={<Link className="primary" to="/apps/new" style={{ display: 'grid', placeItems: 'center' }}>+ Add application</Link>}
      />
      {error ? <p className="banner">{error}</p> : null}
      <section className="stats">
        <article className="card stat"><span>Applications</span><strong>{counts.apps}</strong><em>{published} guides published</em></article>
        <article className="card stat"><span>Users</span><strong>{counts.users}</strong><em>Device accounts</em></article>
        <article className="card stat"><span>Installed</span><strong>{installed}</strong><em>Reported by phones</em></article>
        <article className="card stat"><span>Play installs</span><strong>{catalog.filter((app) => app.install_method === 'play').length}</strong><em>{catalog.filter((app) => app.install_method === 'file').length} server files</em></article>
      </section>
      <section className="split">
        <article className="card card-pad">
          <h2>Application status</h2>
          <p>Where each app is installed from</p>
          {catalog.map((app) => (
            <div className="status-row" key={app.id}>
              <div className="status-main">
                <strong>{app.name}</strong>
                <span>{app.package_name}</span>
              </div>
              <span className={app.install_method === 'file' ? 'chip warn' : 'chip play'}>{sourceLabel(app.install_method)}</span>
              <span>{app.version}</span>
            </div>
          ))}
          {catalog.length === 0 ? <p className="quiet">No applications yet.</p> : null}
        </article>
        <article className="card card-pad">
          <h2>Quick actions</h2>
          <div className="stack">
            <Link className="action" to="/apps/new"><span><strong>Add application</strong><span>Register the package and install source</span></span><span>›</span></Link>
            <Link className="action" to="/users/new"><span><strong>Create user</strong><span>Save Gmail, app password and assigned apps</span></span><span>›</span></Link>
            <Link className="action" to="/apps"><span><strong>Edit a guide</strong><span>Update overview, setup, usage and problems</span></span><span>›</span></Link>
          </div>
        </article>
      </section>
      <article className="card card-pad" style={{ marginTop: 16 }}>
        <h2>Recent activity</h2>
        {activity.map((item) => (
          <div className="activity" key={item.id}>
            <strong>{titleCase(item.kind)}</strong>
            <span>{item.message}</span>
            <span className="muted">{when(item.created_at)}</span>
          </div>
        ))}
        {activity.length === 0 ? <p className="quiet">No activity yet.</p> : null}
      </article>
    </>
  )
}
