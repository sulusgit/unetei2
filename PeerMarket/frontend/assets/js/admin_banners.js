window.ADMIN_BANNERS = (() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s)=> (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));

  function ensureAdminGuard(me){
    if(!me){ location.href="/login.html?next=/admin_banners.html"; return false; }
    if(!me.is_admin){ location.href="/"; return false; }
    return true;
  }

  async function loadBanners(){
    const box = $("banners");
    box.innerHTML = "";
    try{
      const r = await API.get("/api/admin/banners/pending");
      const items = Array.isArray(r.items) ? r.items : [];
      if(!items.length){ box.innerHTML = '<div class="muted">No pending banners</div>'; return; }
      box.innerHTML = items.map(b => `
        <div class="card-btn" data-id="${b.id}">
          <h4>Banner #${b.id} • ${b.position}</h4>
          <div class="muted">${b.start_at} → ${b.end_at}</div>
          <div style="margin-top:8px"><img src="${b.image_url}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px;border:1px solid #eee"></div>
          <div class="muted" style="margin-top:6px"><a href="${b.target_url}" target="_blank" rel="noopener">${esc(b.target_url)}</a></div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button data-act="approve">Approve</button>
            <button data-act="reject">Reject</button>
          </div>
        </div>
      `).join("");

      box.onclick = async (e) => {
        const row = e.target.closest(".card-btn"); if(!row) return;
        const id = row.getAttribute("data-id");
        const act = e.target.getAttribute("data-act");
        if (!act) return;
        try{
          if(act === "approve"){
            await API.postForm(`/api/admin/banners/${id}/approve`, new FormData());
            await loadBanners();
          }else if(act === "reject"){
            await API.postForm(`/api/admin/banners/${id}/reject`, new FormData());
            await loadBanners();
          }
        }catch(err){ alert(err.message || "Action failed"); }
      };
    }catch(e){
      console.error("GET /api/admin/banners/pending failed", e);
      box.innerHTML = '<div class="muted">Banners section will be wired during the payment step.</div>';
    }
  }

  async function init(){
    const me = await AUTH.me();
    if(!ensureAdminGuard(me)) return;
    await loadBanners();
  }

  return { init };
})();