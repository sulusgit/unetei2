window.AUTH = (() => {
  function saveToken(t){ localStorage.setItem("pm_token", t); }
  function clearToken(){ localStorage.removeItem("pm_token"); }
  async function me(){
    if(!API.token()) return null;
    try { return await API.get("/api/auth/me"); }
    catch { return null; }
  }

  async function login(email, password){
    const f = new FormData();
    f.append("email", email);
    f.append("password", password);
    const r = await API.postForm("/api/auth/login", f);
    saveToken(r.access_token);

    try {
      const u = await me();
      const next = new URLSearchParams(location.search).get("next");
      if (u && u.is_admin) {
        location.href = "/admin.html";
      } else if (next) {
        location.href = next;
      } else {
        location.href = "/index.html";
      }
    } catch {
      location.href = "/index.html";
    }

    return r;
  }

  async function register(email, password, name){
    const f = new FormData();
    f.append("email", email);
    f.append("password", password);
    if (name) f.append("name", name);
    return API.postForm("/api/auth/register", f);
  }

  async function requireAuth() {
    const u = await me();
    if (!u) {
      const back = encodeURIComponent(location.pathname + location.search);
      location.href = "/login.html?next=" + back;
      throw new Error("auth required");
    }
    return u;
  }

  async function ensureGuest() {
    const u = await me();
    if (u) {
      location.href = u.is_admin ? "/admin.html" : "/my.html";
      throw new Error("already logged in");
    }
  }

  return { saveToken, clearToken, me, login, register, requireAuth, ensureGuest };
})();