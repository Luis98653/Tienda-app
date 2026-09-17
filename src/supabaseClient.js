import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://afvlnosqgzcdhzonkabq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdmxub3NxZ3pjZGh6b25rYWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDcxOTksImV4cCI6MjA5NDEyMzE5OX0.vhod6ZZUpV_n0Gq_5Bzxvj9OU95QHpWOI4z5LVpkb0I'
);