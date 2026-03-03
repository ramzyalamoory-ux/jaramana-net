import { createClient } from '@supabase/supabase-js'

// Supabase credentials
const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// GET - Fetch all or with filter
export async function supabaseFetch(table: string, options?: { 
  select?: string; 
  filter?: string; 
  order?: string;
  limit?: number;
}) {
  let query = supabase.from(table).select(options?.select || '*')
  
  if (options?.filter) {
    // Parse filter like "name=eq.value" or "id=eq.1"
    const [field, condition] = options.filter.split('=')
    const [op, value] = condition.split('.')
    if (op === 'eq') {
      query = query.eq(field, value)
    } else if (op === 'ilike') {
      query = query.ilike(field, `%${value}%`)
    }
  }
  
  if (options?.order) {
    const [col, dir] = options.order.split('.')
    query = query.order(col, { ascending: dir === 'asc' })
  }
  
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  const { data, error } = await query
  if (error) {
    console.error('Supabase fetch error:', error)
    throw error
  }
  return data
}

// INSERT - Add new record
export async function supabaseInsert(table: string, values: any) {
  const { data, error } = await supabase.from(table).insert(values).select()
  if (error) {
    console.error('Supabase insert error:', error)
    throw error
  }
  return data
}

// UPDATE - Update record by ID
export async function supabaseUpdate(table: string, id: number | string, values: any) {
  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq('id', id)
    .select()
  if (error) {
    console.error('Supabase update error:', error)
    throw error
  }
  return data
}

// DELETE - Delete record by ID
export async function supabaseDelete(table: string, id: number | string) {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .select()
  if (error) {
    console.error('Supabase delete error:', error)
    throw error
  }
  return data
}

// SEARCH - Search by name or phone
export async function supabaseSearch(table: string, query: string, fields: string[] = ['name', 'phone']) {
  const conditions = fields.map(field => `${field}.ilike.%${query}%`).join(',')
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .or(conditions)
  
  if (error) {
    console.error('Supabase search error:', error)
    throw error
  }
  return data
}

// Check if configured
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}
