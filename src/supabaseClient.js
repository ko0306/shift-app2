import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csyjgivzvkypwhococfv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeWpnaXZ6dmt5cHdob2NvY2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNzA1MjIsImV4cCI6MjA2NjY0NjUyMn0.z4VP9e98Mg6_tipaV_TPgznb01iHSg_cXynKtj27HuU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
