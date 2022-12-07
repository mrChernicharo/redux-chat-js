import { createClient } from "@supabase/supabase-js";

const db = createClient(import.meta.env.VITE_PROJECT_URL, import.meta.env.VITE_ANON_PUB);

export default db;
