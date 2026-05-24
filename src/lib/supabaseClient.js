import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://amzaxbmhzadwisyscvmm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtemF4Ym1oemFkd2lzeXNjdm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDE2NTgsImV4cCI6MjA5NTE3NzY1OH0.i1cNHvskKzC0drfquJb3sswPGD3lgPlg6Va3ZfexyrQ"
);