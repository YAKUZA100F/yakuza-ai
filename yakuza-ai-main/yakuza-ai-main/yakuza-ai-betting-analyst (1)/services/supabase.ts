import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://guxxwtavfysgoaliyntc.supabase.co';
const supabaseAnonKey = 'sb_publishable_rs_FChaH-lzIrSt4uk822Q_W3iQbljL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);