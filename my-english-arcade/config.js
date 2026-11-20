// Public configuration only. NEVER put a service_role key or Google client secret here.
// Same Supabase project and Google login as the other MY apps (Reading Passport, Brain Up, Word Arcade ...).
// The session is shared on tfellow.github.io: log in once, every MY app knows you.
window.MY_CONFIG = {
  supabaseUrl: 'https://jkxdhyvnrvsiokbbbjtu.supabase.co',
  supabaseAnonKey: 'sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF', // publishable (public-safe) key
  googleClientId: '359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com',
  schoolDomain: 'smy.ms.kr',
  // Display only. The real admin check is myea_is_admin() on the server
  // (= shared public.is_admin() admins table + engwords@gmail.com for this app only).
  adminEmails: ['tfellow@gmail.com', 'tfellow@smy.ms.kr', 'engwords@gmail.com', 'engwords@smy.ms.kr', 'hist1026@gmail.com'],
  appOnlyAdmins: ['engwords@gmail.com']
};
