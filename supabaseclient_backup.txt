import { createClient } from '@supabase/supabase-js';

//podaci za povezivanje
const SUPABASE_URL = 'https://opckmcxwoanlozwgrsab.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY2ttY3h3b2FubG96d2dyc2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyMDk3NDcsImV4cCI6MjA1Mjc4NTc0N30.x-AMHUjpmG_Tqh1GhuNDXpggfVwR_cU09aAlZkJFKbQ';

// Kreiranje klijenta s
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);