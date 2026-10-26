import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ungftzhnitrfpgzomfzn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_h2TMpYol_HRlQ-N-CzjZ6g__ZUg_IAI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
