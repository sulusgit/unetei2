window.BANNER_POST = (() => {
  const $ = (id) => document.getElementById(id);

  function toText(err){
    if (!err) return "Failed.";
    if (typeof err === "string") return err;
    if (err.detail) {
      if (Array.isArray(err.detail)) return err.detail.map(x => x.msg || x.detail || JSON.stringify(x)).join("; ");
      return String(err.detail);
    }
    if (err.message) return err.message;
    try { return JSON.stringify(err); } catch { return "Failed."; }
  }
  function msg(t){ $("msg").textContent = t || ""; }

  async function submit(){
    msg("");
    const f = new FormData();
    const position = $("position").value;
    const target = $("target").value.trim();
    const start = $("start").value;
    const end = $("end").value;
    const file = $("image").files[0];

    if(!file){ msg("Please choose an image."); return; }
    if(!target){ msg("Please enter a target URL."); return; }
    if(!start || !end){ msg("Please choose start/end dates."); return; }

    f.append("position", position);
    f.append("target_url", target);
    f.append("start_at", start);
    f.append("end_at", end);
    f.append("image", file);

    try{
      const r = await API.postForm("/api/banners", f); 
      msg(r.message || "Submitted. Awaiting approval.");
      await loadMine();
      $("image").value = "";
    }catch(e){
      msg(toText(e));
    }
  }

  function row(b){
    const s = new Date(b.start_at).toLocaleDateString();
    const e = new Date(b.end_at).toLocaleDateString();
    const el = document.createElement("div");
    el.className = "row";
    el.style.cssText = "border:1px solid #eee;border-radius:10px;padding:10px;display:grid;grid-template-columns:120px 1fr;gap:10px";
    el.innerHTML = `
      <div><img src="${b.image_url}" alt="" style="width:120px;height:90px;object-fit:cover;border-radius:6px;background:#fafafa"></div>
      <div>
        <div style="font-weight:700">${b.position.toUpperCase()}</div>
        <div class="muted">${s} → ${e}</div>
        <div class="muted">Status: <b>${b.status}</b></div>
        <div><a href="${b.target_url}" target="_blank" rel="noopener">${b.target_url}</a></div>
      </div>
    `;
    return el;
  }

  async function loadMine(){
    const box = $("mine");
    box.innerHTML = "";
    try{
      const r = await API.get("/api/banners/mine");
      const items = Array.isArray(r.items) ? r.items : [];
      if(!items.length){
        box.innerHTML = `<div class="muted">No banners yet.</div>`;
        return;
      }
      items.forEach(b => box.appendChild(row(b)));
    }catch(e){
      box.innerHTML = `<div class="muted">Failed to load banners.</div>`;
    }
  }

  async function init(){
    $("submit").onclick = submit;
    const today = new Date();
    const d7 = new Date(Date.now() + 7*86400*1000);
    const fmt = d => d.toISOString().slice(0,10);
    $("start").value = fmt(today);
    $("end").value = fmt(d7);
    await loadMine();
  }

  return { init };
})();