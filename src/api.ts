const TOKEN_KEY = 'otofarma.admin.token'

export type Me = {
  id: string
  kind: string
  name: string
  email: string
}

export type Activity = {
  id: string
  kind: string
  message: string
  created_at: string
}

export type Summary = {
  users: number
  apps: number
  activities: Activity[]
}

export type CatalogApp = {
  id: string
  name: string
  package_name: string
  version: string
  install_method: 'play' | 'file'
  play_url: string | null
  has_file: boolean
  apk_filename: string | null
  guide_published: boolean
  updated_at: string
}

export type AssignedApp = {
  id: string
  name: string
  package_name: string
  installed: boolean
  installed_version: string | null
  reported_at: string | null
}

export type NotificationItem = {
  id: string
  kind: string
  title: string
  body: string
  created_at: string
}

export type DeviceUser = {
  id: string
  name: string
  role: string
  gmail: string
  gmail_password: string | null
  app_password: string | null
  apps: AssignedApp[]
  notifications: NotificationItem[]
}

export type GuideMedia = {
  id: string
  name: string
  url: string
}

export type GuideBlock = {
  id: string
  title: string
  body: string
  solution: string | null
  images: GuideMedia[]
  videos: GuideMedia[]
}

export type Guide = {
  overview: GuideBlock[]
  setup: GuideBlock[]
  usage: GuideBlock[]
  problems: GuideBlock[]
}

export type GuideResponse = {
  draft: Guide
  published: Guide | null
}

export const SECTIONS = ['overview', 'setup', 'usage', 'problems'] as const
export type Section = (typeof SECTIONS)[number]

export function token() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function saveToken(value: string) {
  sessionStorage.setItem(TOKEN_KEY, value)
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const auth = token()
  if (auth) headers.set('Authorization', `Bearer ${auth}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(`/api${path}`, { ...options, headers })
  if (response.status === 401 && path !== '/auth/login') {
    clearToken()
    if (window.location.pathname !== '/login') window.location.assign('/login')
  }
  if (response.status === 204) return undefined as T
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const detail = data && typeof data === 'object' ? data.detail : null
    const message = typeof detail === 'string' ? detail : 'Request failed'
    throw new ApiError(response.status, message)
  }
  return data as T
}

export function login(email: string, password: string) {
  return request<{ access_token: string; kind: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function me() {
  return request<Me>('/me')
}

export function summary() {
  return request<Summary>('/admin/summary')
}

export function apps() {
  return request<CatalogApp[]>('/admin/apps')
}

export function createApp(body: {
  name: string
  package_name: string
  version: string
  install_method: 'play' | 'file'
  play_url: string | null
}) {
  return request<CatalogApp>('/admin/apps', { method: 'POST', body: JSON.stringify(body) })
}

export function updateApp(id: string, body: Record<string, unknown>) {
  return request<CatalogApp>(`/admin/apps/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteApp(id: string) {
  return request<void>(`/admin/apps/${id}`, { method: 'DELETE' })
}

export function uploadApk(id: string, file: File) {
  const body = new FormData()
  body.append('file', file)
  return request<CatalogApp>(`/admin/apps/${id}/file`, { method: 'POST', body })
}

export function guide(id: string) {
  return request<GuideResponse>(`/admin/apps/${id}/guide`)
}

export function saveGuide(id: string, body: unknown) {
  return request<{ draft: Guide }>(`/admin/apps/${id}/guide`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function publishGuide(id: string) {
  return request<{ published: Guide }>(`/admin/apps/${id}/guide/publish`, { method: 'POST' })
}

export function uploadMedia(id: string, kind: 'image' | 'video', file: File) {
  const body = new FormData()
  body.append('file', file)
  return request<GuideMedia & { kind: string }>(`/admin/apps/${id}/media?kind=${kind}`, {
    method: 'POST',
    body,
  })
}

export function users() {
  return request<DeviceUser[]>('/admin/users')
}

export function createUser(body: {
  name: string
  role: string
  gmail: string
  gmail_password: string
  app_password: string
  app_ids: string[]
}) {
  return request<DeviceUser>('/admin/users', { method: 'POST', body: JSON.stringify(body) })
}

export function updateUser(id: string, body: Record<string, unknown>) {
  return request<DeviceUser>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteUser(id: string) {
  return request<void>(`/admin/users/${id}`, { method: 'DELETE' })
}

export function sourceLabel(method: string) {
  return method === 'file' ? 'Server file' : 'Google Play'
}

export function titleCase(value: string) {
  const text = value.replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function when(value: string | null) {
  if (!value) return 'Not reported'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export function emptyGuide(): Guide {
  return { overview: [], setup: [], usage: [], problems: [] }
}
