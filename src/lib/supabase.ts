import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing. " +
      "Auth and data will not work until you set them in .env.local."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export type Incubator = {
  id: string;
  user_id: string;
  name: string;
  partner: string | null;
  location: string | null;
  cohort_size: number | null;
  start_date: string | null;
  notes: string | null;
  created_at: string;
};

export type Venture = {
  id: string;
  user_id: string;
  name: string;
  sector: string | null;
  stage: string | null;
  incubator_id: string | null;
  founder_email: string | null;
  founder_name: string | null;
  status: string;
  created_at: string;
};

export type EmailDraft = {
  id: string;
  user_id: string;
  venture_id: string | null;
  kind: "pre" | "post";
  subject: string;
  body: string;
  created_at: string;
};
