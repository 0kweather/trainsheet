// Address of your deployed relay (see relay/README.md), e.g.
// "https://trainsheet-relay.yourname.workers.dev". Leave empty to show only
// the feeds browsers can read directly.
window.TRAINSHEET_RELAY = "https://traintracker-relay.alexanderbronzini.workers.dev";

// Per-feed addresses that override the relay, for feeds that block it.
// UTA refuses Cloudflare, so FrontRunner can come from the Vercel function in
// api/uta.js: { uta: "https://<project>.vercel.app/api/uta" }
window.TRAINSHEET_FEEDS = {};

// Accounts (signing in, a rider's trips, tracked trains on every device):
// a Supabase project's URL and its public "anon" key, from Project Settings ›
// API (the anon key is meant for web pages; never put the service_role key
// here). Leave url empty to leave accounts out. providers lists the sign-in
// buttons offered besides email, each turned on under Authentication ›
// Providers: "google", "facebook", "apple", "github", "azure", "discord".
// See README, "Accounts".
window.TRAINSHEET_ACCOUNTS = { url: "https://zmjzfhmeixauuzteqmgi.supabase.co", key: "sb_publishable_eggvhVjWV_QOvjpo56SOxg_u24ev9iJ", providers: ["google"] };
