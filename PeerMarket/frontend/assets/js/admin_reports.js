window.ADMIN_REPORTS = (() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s)=> (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
  let CACHE = [];

  function ensureAdminGuard(me){
    if(!me){ location.href="/login.html?next=/admin.html"; return false; }
    if(!me.is_admin){ location.href="/"; return false; }
    return true;
  }

  async function loadReports(){
    const box = $("reports");
    box.innerHTML = "";
    try{
      const r = await API.get("/api/admin/reports");
      const items = Array.isArray(r.items) ? r.items : [];
      CACHE = items;

      if(!items.length){
        box.innerHTML = '<div class="muted">No reports</div>';
        return;
      }

      box.innerHTML = items.map(x => `
        <a href="#" class="card card-btn" data-id="${x.id}">
          <h4 style="margin:0 0 6px">#${x.id} • ${esc(x.title || "")}</h4>
          <div class="muted">${x.city || ""} ${x.created_at ? "• "+new Date(x.created_at).toLocaleString() : ""}</div>
          <div style="margin-top:8px;max-height:3.2em;overflow:hidden">${esc(x.reason || "").slice(0,180)}</div>
        </a>
      `).join("");
      
      box.onclick = (e) => {
        const a = e.target.closest(".card-btn"); if(!a) return;
        e.preventDefault();
        openModal(+a.dataset.id);
      };
    }catch(e){
      console.error("GET /api/admin/reports failed", e);
      box.innerHTML = '<div class="muted">Failed to load reports</div>';
    }
  }

  function openModal(id){
    const x = CACHE.find(i => i.id === id);
    if(!x) return;

    const dlg = $("dlg-report");
    $("rep-meta").textContent =
      `Listing #${x.id}${x.city ? " • " + x.city : ""}${x.created_at ? " • "+new Date(x.created_at).toLocaleString() : ""}`;
    $("rep-reason").textContent = x.reason || "";
    $("rep-action-reason").value = x.reason || "";

    $("rep-cancel").onclick = (e)=>{ e.preventDefault(); dlg.close(); };

    $("rep-dismiss").onclick = async (e)=>{
      e.preventDefault();
      try{
        await API.postForm(`/api/admin/reports/${x.id}/dismiss`, new FormData());
        dlg.close();
        await loadReports();
      }catch(err){ alert(err.message || "Failed"); }
    };

    $("rep-deactivate").onclick = async (e)=>{
      e.preventDefault();
      const reason = $("rep-action-reason").value.trim();
      if(!reason){ alert("Please enter a reason to email the owner."); return; }
      const f = new FormData(); f.append("reason", reason);
      try{
        await API.postForm(`/api/admin/reports/${x.id}/deactivate`, f);
        dlg.close();
        await loadReports();
        alert("Listing deactivated and owner notified.");
      }catch(err){ alert(err.message || "Failed"); }
    };

    dlg.showModal();
  }

  async function init(){
    const me = await AUTH.me();
    if(!ensureAdminGuard(me)) return;
    await loadReports();
  }

  return { init };
})();