import { createClient } from '@supabase/supabase-js'

// Use the URL you found earlier
const supabaseUrl = 'https://bwmlqsgykqrrpwswdgsp.supabase.co' 

// Use the "Publishable Key" here
const supabaseKey = 'sb_publishable_SUeSDzRWMx0oAJLvKLGYbQ_VqPX9HA4' 

export const supabase = createClient(supabaseUrl, supabaseKey)