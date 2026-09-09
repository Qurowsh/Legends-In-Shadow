import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'http://localhost:54321/'
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

export const supabase = createClient(
    supabaseUrl,
    supabaseKey
)