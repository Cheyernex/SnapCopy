import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase = null
let authListener = null

export function createSupabaseClient() {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })
  return supabase
}

export function getSupabase() {
  if (!supabase) throw new Error('Supabase not initialized')
  return supabase
}

export function isConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export function onAuthStateChange(callback) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return data?.subscription?.unsubscribe || (() => {})
}

function mapSnippet(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    color: row.color,
    workspace: row.workspace || 'General',
    pinned: row.pinned || false,
    folder: row.folder || null,
  }
}

export async function fetchCloudSnippets() {
  const { data, error } = await getSupabase()
    .from('snippets')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapSnippet)
}

export async function saveCloudSnippet(snippet) {
  const { data: { user } } = await getSupabase().auth.getUser()
  if (!user) return

  const row = {
    id: snippet.id,
    user_id: user.id,
    title: snippet.title,
    category: snippet.category,
    content: snippet.content,
    color: snippet.color,
    workspace: snippet.workspace || 'General',
    pinned: snippet.pinned || false,
    folder: snippet.folder || null,
  }
  const { error } = await getSupabase()
    .from('snippets')
    .upsert(row, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteCloudSnippet(id) {
  const { error } = await getSupabase()
    .from('snippets')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteCloudSnippetsByWorkspace(workspace) {
  const { error } = await getSupabase()
    .from('snippets')
    .delete()
    .eq('workspace', workspace)
  if (error) throw error
}

// ─── User Settings (workspaces, folders, colors, themes, categories, icons) ───

/**
 * Fetch the persisted app settings (non-snippet config) from Supabase.
 * Returns null if no settings exist yet for the user.
 */
export async function fetchUserSettings() {
  try {
    const { data: { user } } = await getSupabase().auth.getUser()
    if (!user) return null

    const { data, error } = await getSupabase()
      .from('user_settings')
      .select('settings')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.warn('Could not fetch user settings:', error.message)
      return null
    }
    return data?.settings || null
  } catch (err) {
    console.warn('fetchUserSettings error:', err)
    return null
  }
}

/**
 * Upsert the app settings (non-snippet config) into Supabase.
 * @param {Object} settings - { workspaces, currentWorkspace, folders, workspaceColors, workspaceThemes, categoriesOrder, categoryIcons }
 */
export async function saveUserSettings(settings) {
  try {
    const { data: { user } } = await getSupabase().auth.getUser()
    if (!user) return

    const { error } = await getSupabase()
      .from('user_settings')
      .upsert(
        { user_id: user.id, settings, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.warn('Could not save user settings:', error.message)
    }
  } catch (err) {
    console.warn('saveUserSettings error:', err)
  }
}

