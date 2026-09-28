import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apps, deleteApp, sourceLabel, type CatalogApp } from '../api'
import { PageHeader } from '../layout'

export function AppsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<CatalogApp[]>([])
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('all')
  const [error, setError] = useState<string | null>(null)

  function load() {
    apps()
      .then(setRows)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Could not load applications'))
  }

  useEffect(load, [])

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    return rows.filter((app) => {
      const matchesText = !text || `${app.name} ${app.package_name}`.toLowerCase().includes(text)
      const matchesSource = source === 'all' || app.install_method === source
      return matchesText && matchesSource
    })
  }, [rows, query, source])

  async function remove(app: CatalogApp) {
    if (!window.confirm(`Delete ${app.name}? It will also leave every user list.`)) return
    try {
      await deleteApp(app.id)
      setRows((current) => current.filter((item) => item.id !== app.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete the application')
    }
  }

  return (
    <>
      <PageHeader
        title="Applications"
        text="Control which Android apps are available in the companion app."
        action={<button className="primary" type="button" onClick={() => navigate('/apps/new')}>+ Add application</button>}
      />
      {error ? <p className="banner">{error}</p> : null}
      <div className="toolbar">
        <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search applications or package name" />
        <select className="select" value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="all">Source: All</option>
          <option value="play">Google Play</option>
          <option value="file">Server file</option>
        </select>
      </div>
      <section className="card table">
        <div className="table-row apps-row table-head">
          <span>Application</span><span>Source</span><span>Version</span><span>Guide</span><span>Actions</span>
        </div>
        {visible.map((app) => (
          <div className="table-row apps-row" key={app.id}>
            <div className="status-main">
              <strong>{app.name}</strong>
              <span>{app.package_name}</span>
            </div>
            <span className={app.install_method === 'file' ? 'chip warn' : 'chip play'}>{sourceLabel(app.install_method)}</span>
            <span>{app.version}</span>
            <span className={app.guide_published ? 'chip ok' : 'chip warn'}>{app.guide_published ? 'Published' : 'Draft'}</span>
            <span className="actions">
              <Link className="ghost" to={`/apps/${app.id}`} style={{ display: 'grid', placeItems: 'center' }}>Edit</Link>
              <button className="danger" type="button" onClick={() => void remove(app)}>Delete</button>
            </span>
          </div>
        ))}
        {visible.length === 0 ? <p className="quiet">No applications match.</p> : null}
      </section>
    </>
  )
}
