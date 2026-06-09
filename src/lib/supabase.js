import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qjmmnotyouboaknxmpkw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbW1ub3R5b3Vib2FrbnhtcGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NjM1ODgsImV4cCI6MjA5NjIzOTU4OH0.7Tqc9eXwfkuKw7jDMory0SS4VGvU_gpDa10we68eDcE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
