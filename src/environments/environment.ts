export const environment = {
  production: false,
  // Marketplace switch. While false, tidecrew.co lands on /FIRST and the store
  // routes are only reachable by admins (so the team can keep building it).
  storeOpen: false,
  // Supabase → Project Settings → API. The anon key is meant to ship in the browser;
  // Row-Level Security (from 0001_tidecrew_init.sql) is what actually guards the data.
  supabaseUrl: 'https://brnhuzyaecrelqpnntta.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybmh1enlhZWNyZWxxcG5udHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjQ1ODAsImV4cCI6MjA5ODAwMDU4MH0.K9xoszRba2I8GADM195hmVtOp8AdZKaubAE5r9Xyo50',
};
