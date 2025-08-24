window.API = (() => {
  const base = ""; 
  const getToken = () => localStorage.getItem("pm_token") || "";
  const authHeader = () => {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const handle = async (resp) => {
    if (resp.ok) {
      const ct = resp.headers.get("content-type") || "";
      if (ct.includes("application/json")) return resp.json();
      const text = await resp.text();
      return text ? JSON.parse(text) : {};
    }
    let msg = resp.statusText;
    try { const err = await resp.json(); msg = err.detail || JSON.stringify(err); } catch {}
    throw new Error(msg);
  };

  const get = (url) => fetch(base + url, { headers: { ...authHeader() } }).then(handle);
  const del = (url) => fetch(base + url, { method: "DELETE", headers: { ...authHeader() } }).then(handle);
  const postForm = (url, form) => fetch(base + url, { method: "POST", headers: { ...authHeader() }, body: form }).then(handle);
  const patchForm = (url, form) => fetch(base + url, { method: "PATCH", headers: { ...authHeader() }, body: form }).then(handle);

  return { get, del, postForm, patchForm, token: getToken, authHeader };
})();