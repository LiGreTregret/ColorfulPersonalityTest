import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://ngzlxewjlvsxgvbgnirp.supabase.co';
const supabaseKey = 'sb_publishable_eKG-1TxmJmr2nP95wtkmWw_1LDGcsKs';

export const supabase = createClient(supabaseUrl, supabaseKey);