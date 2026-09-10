import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://upuqgnysdzqlxpfehqhp.supabase.co'
const supabaseKey = 'sb_publishable_6LUu00I0Jyqvufr7RC9Llg_asKqCMTF'

export const supabase = createClient(
    supabaseUrl,
    supabaseKey
)