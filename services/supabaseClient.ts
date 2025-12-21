import { createClient } from '@supabase/supabase-js';

// KENDİ SUPABASE PROJE BİLGİLERİNİZİ BURAYA GİRMELİSİNİZ
const SUPABASE_URL = 'https://xyzcompany.supabase.co'; // Örn: https://abcedfgh.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Settings > API > Project API Keys > anon public

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);