import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  SECTIONS,
  apps,
  createApp,
  deleteApp,
  emptyGuide,
  guide,
  publishGuide,
  saveGuide,
  updateApp,
  uploadApk,
  uploadMedia,
  type CatalogApp,
  type Guide,
  type GuideBlock,
  type Section,
} from '../api'
import { PageHeader } from '../layout'

const LABELS: Record<Section, string> = {
  overview: 'Overview',
  setup: 'Setup',
  usage: 'Usage',
  problems: 'Problems',
}

function blankBlock(): GuideBlock {
  return { id: '', title: '', body: '', solution: '', images: [], videos: [] }
}

function guidePayload(value: Guide) {
  const items = (blocks: GuideBlock[]) =>
    blocks.map((block) => ({
      ...(block.id ? { id: block.id } : {}),
      title: block.title.trim(),
      body: block.body,
      solution: block.solution?.trim() ? block.solution.trim() : null,
      image_ids: block.images.map((item) => item.id),
      video_ids: block.videos.map((item) => item.id),
    }))
  return {
    overview: items(value.overview),
    setup: items(value.setup),
    usage: items(value.usage),
    problems: items(value.problems),
  }
}

export function AppEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [packageName, setPackageName] = useState('')
  const [version, setVersion] = useState('')
  const [method, setMethod] = useState<'play' | 'file'>('play')
  const [playUrl, setPlayUrl] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [guideDraft, setGuideDraft] = useState<Guide>(emptyGuide())
  const [published, setPublished] = useState(false)
  const [section, setSection] = useState<Section>('overview')
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    let alive = true
    Promise.all([apps(), guide(id)])
      .then(([rows, current]) => {
        if (!alive) return
        const app = rows.find((item) => item.id === id)
        if (!app) {
          setError('Application not found')
          return
        }
        fill(app)
        setGuideDraft({ ...emptyGuide(), ...current.draft })
        setPublished(current.published !== null)
      })
      .catch((caught) => {
        if (alive) setError(caught instanceof Error ? caught.message : 'Could not load the application')
      })
    return () => {
      alive = false
    }
  }, [id])

  function fill(app: CatalogApp) {
    setName(app.name)
    setPackageName(app.package_name)
    setVersion(app.version)
    setMethod(app.install_method)
    setPlayUrl(app.play_url ?? '')
    setFileName(app.apk_filename)
  }

  async function saveApp(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setNote(null)
    const body = {
      name: name.trim(),
      package_name: packageName.trim(),
      version: version.trim(),
      install_method: method,
      play_url: method === 'play' ? playUrl.trim() : null,
    }
    try {
      if (!id) {
        const created = await createApp(body)
        navigate(`/apps/${created.id}`, { replace: true })
        return
      }
      const updated = await updateApp(id, body)
      fill(updated)
      setNote('Application saved')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the application')
    } finally {
      setBusy(false)
    }
  }

  async function onApk(file: File) {
    if (!id) return
    setError(null)
    try {
      const updated = await uploadApk(id, file)
      fill(updated)
      setNote('Install file uploaded')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not upload the APK')
    }
  }

  function updateBlock(index: number, patch: Partial<GuideBlock>) {
    setGuideDraft((current) => ({
      ...current,
      [section]: current[section].map((block, itemIndex) => (itemIndex === index ? { ...block, ...patch } : block)),
    }))
  }

  async function storeGuide() {
    if (!id) return
    const missing = SECTIONS.some((key) => guideDraft[key].some((block) => !block.title.trim()))
    if (missing) {
      setError('Every guide item needs a title.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const saved = await saveGuide(id, guidePayload(guideDraft))
      setGuideDraft({ ...emptyGuide(), ...saved.draft })
      setNote('Guide draft saved. The phone still shows the published guide.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the guide')
    } finally {
      setBusy(false)
    }
  }

  async function publish() {
    if (!id) return
    const missing = SECTIONS.some((key) => guideDraft[key].some((block) => !block.title.trim()))
    if (missing) {
      setError('Every guide item needs a title.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await saveGuide(id, guidePayload(guideDraft))
      await publishGuide(id)
      setPublished(true)
      setNote('Guide published. Assigned phones can open it.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not publish the guide')
    } finally {
      setBusy(false)
    }
  }

  async function attach(index: number, kind: 'image' | 'video', file: File) {
    if (!id) return
    const currentSection = section
    setError(null)
    try {
      const media = await uploadMedia(id, kind, file)
      const item = { id: media.id, name: media.name, url: media.url }
      setGuideDraft((current) => ({
        ...current,
        [currentSection]: current[currentSection].map((block, itemIndex) => {
          if (itemIndex !== index) return block
          return kind === 'image'
            ? { ...block, images: [...block.images, item] }
            : { ...block, videos: [...block.videos, item] }
        }),
      }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not upload the file')
    }
  }

  async function remove() {
    if (!id || !window.confirm(`Delete ${name}? It will also leave every user list.`)) return
    await deleteApp(id)
    navigate('/apps', { replace: true })
  }

  return (
    <>
      <PageHeader
        title={id ? name || 'Application' : 'Add application'}
        text="Choose whether the phone opens Google Play or downloads the APK from the server."
        action={
          <div className="actions">
            <Link className="ghost" to="/">Dashboard</Link>
            {id ? <button className="danger" type="button" onClick={() => void remove()}>Delete</button> : null}
          </div>
        }
      />
      {error ? <p className="banner">{error}</p> : null}
      {note ? <p className="ok-note">{note}</p> : null}
      <form className="form" onSubmit={saveApp}>
        <label className="field"><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} required /></label>
        <div className="row-2">
          <label className="field"><span>Package name</span><input value={packageName} onChange={(event) => setPackageName(event.target.value)} required minLength={3} /></label>
          <label className="field"><span>Version</span><input value={version} onChange={(event) => setVersion(event.target.value)} required /></label>
        </div>
        <label className="field">
          <span>Install source</span>
          <select value={method} onChange={(event) => setMethod(event.target.value as 'play' | 'file')}>
            <option value="play">Google Play</option>
            <option value="file">Download from server</option>
          </select>
        </label>
        {method === 'play' ? (
          <label className="field"><span>Google Play link</span><input value={playUrl} onChange={(event) => setPlayUrl(event.target.value)} required placeholder="https://play.google.com/store/apps/details?id=" /></label>
        ) : (
          <div className="field">
            <span>APK file {fileName ? `· current: ${fileName}` : ''}</span>
            {id ? <input type="file" accept=".apk" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onApk(file) }} /> : <p className="quiet">Save the application first, then upload the APK.</p>}
          </div>
        )}
        <button className="primary" type="submit" disabled={busy}>{id ? 'Save application' : 'Create application'}</button>
      </form>

      {id ? (
        <section>
          <h2 className="section-title">Guide {published ? '· published' : '· not published'}</h2>
          <p className="quiet">Text changes stay hidden on the phone until you publish. Publishing does not require a new APK.</p>
          <div className="tabs">
            {SECTIONS.map((item) => (
              <button className={item === section ? 'primary' : 'ghost'} key={item} type="button" onClick={() => setSection(item)}>
                {LABELS[item]}
              </button>
            ))}
          </div>
          {guideDraft[section].map((block, index) => (
            <article className="guide-item" key={`${section}-${block.id || index}`}>
              <label className="field"><span>Title</span><input value={block.title} onChange={(event) => updateBlock(index, { title: event.target.value })} /></label>
              <label className="field"><span>Text</span><textarea value={block.body} onChange={(event) => updateBlock(index, { body: event.target.value })} /></label>
              <label className="field"><span>Solution</span><textarea value={block.solution ?? ''} onChange={(event) => updateBlock(index, { solution: event.target.value })} /></label>
              <div className="media">
                {block.images.map((image) => (
                  <span key={image.id}>{image.name} <button className="text-btn" type="button" onClick={() => updateBlock(index, { images: block.images.filter((item) => item.id !== image.id) })}>Remove</button></span>
                ))}
                {block.videos.map((video) => (
                  <span key={video.id}>{video.name} <button className="text-btn" type="button" onClick={() => updateBlock(index, { videos: block.videos.filter((item) => item.id !== video.id) })}>Remove</button></span>
                ))}
              </div>
              <div className="actions" style={{ justifyContent: 'flex-start' }}>
                <label className="ghost" style={{ display: 'grid', placeItems: 'center' }}>
                  Add image
                  <input hidden type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void attach(index, 'image', file) }} />
                </label>
                <label className="ghost" style={{ display: 'grid', placeItems: 'center' }}>
                  Add video
                  <input hidden type="file" accept="video/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void attach(index, 'video', file) }} />
                </label>
                <button className="danger" type="button" onClick={() => setGuideDraft((current) => ({ ...current, [section]: current[section].filter((_, itemIndex) => itemIndex !== index) }))}>Remove item</button>
              </div>
            </article>
          ))}
          <div className="actions" style={{ justifyContent: 'flex-start' }}>
            <button className="ghost" type="button" onClick={() => setGuideDraft((current) => ({ ...current, [section]: [...current[section], blankBlock()] }))}>Add item</button>
            <button className="ghost" type="button" disabled={busy} onClick={() => void storeGuide()}>Save draft</button>
            <button className="primary" type="button" disabled={busy} onClick={() => void publish()}>Publish</button>
          </div>
        </section>
      ) : null}
    </>
  )
}
