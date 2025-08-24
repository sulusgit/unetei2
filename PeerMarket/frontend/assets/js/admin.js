window.ADMIN = (() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s)=> (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
  let REPORTS_CACHE = [];

  function ensureAdminGuard(me){
    if(!me){ location.href="/login.html?next=/admin.html"; return false; }
    if(!me.is_admin){ location.href="/"; return false; }
    return true;
  }

  function switchPanel(which){
    const isReports = which === "reports";
    $("nav-reports").classList.toggle("active", isReports);
    $("nav-banners").classList.toggle("active", !isReports);
    $("panel-reports").style.display = isReports ? "" : "none";
    $("panel-banners").style.display = isReports ? "none" : "";
    if (!isReports) location.hash = "#banners"; else history.replaceState(null,"","/admin.html");
  }

  function normReport(x){
    const id          = x.id ?? x.report_id ?? x.reportID;
    const listing_id  = x.listing_id ?? x.listingId ?? (x.listing && (x.listing.id ?? x.listing));
    const reporter_id = x.reporter_id ?? x.user_id ?? x.userId ?? (x.reporter && (x.reporter.id ?? x.reporter));
    const reason      = x.reason ?? x.message ?? x.note ?? "";
    const created     = x.created_at ?? x.createdAt ?? x.created ?? x.timestamp ?? null;
    return { id, listing_id, reporter_id, reason, created };
  }

  async function loadReports(){
    const box = $("reports");
    box.innerHTML = "";
    try{
      const r = await API.get("/api/admin/reports");
      const raw = Array.isArray(r.items) ? r.items : (Array.isArray(r) ? r : []);
      const items = raw.map(normReport).filter(x => x.id != null);
      REPORTS_CACHE = items;

      if(!items.length){ box.innerHTML = '<div class="muted">No reports</div>'; return; }

      box.innerHTML = items.map(x => `
        <a href="#" class="card-btn" data-id="${x.id}">
          <h4>#${x.id}${x.listing_id ? ` • Listing ${x.listing_id}` : ""}</h4>
          <div class="muted">${x.created ? new Date(x.created).toLocaleString() : ""}</div>
          <div class="muted" style="margin-top:4px">${x.reporter_id ? `Reporter: ${x.reporter_id}` : ""}</div>
          <div style="margin-top:8px;max-height:3.2em;overflow:hidden">${esc(x.reason).slice(0,180)}</div>
        </a>
      `).join("");

      box.onclick = (e) => {
        const a = e.target.closest(".card-btn"); if(!a) return;
        e.preventDefault();
        const id = +a.getAttribute("data-id");
        openReportModal(id);
      };
    }catch(e){
      console.error("GET /api/admin/reports failed", e);
      box.innerHTML = '<div class="muted">Failed to load reports</div>';
    }
  }

  function openReportModal(id){
    const r = REPORTS_CACHE.find(x => x.id === id);
    if(!r) return;
    const dlg = $("dlg-report");
    $("rep-meta").textContent = `Report #${r.id}${r.listing_id ? ` • Listing ${r.listing_id}` : ""}${r.created ? ` • ${new Date(r.created).toLocaleString()}` : ""}`;
    $("rep-reason").textContent = r.reason || "";
    $("rep-action-reason").value = "";

    $("rep-cancel").onclick = (e)=>{ e.preventDefault(); dlg.close(); };

    $("rep-dismiss").onclick = async (e)=>{
      e.preventDefault();
      try{
        await API.postForm(`/api/admin/reports/${r.id}/dismiss`, new FormData());
        dlg.close();
        await loadReports();
      }catch(err){ alert(err.message || "Failed"); }
    };

    $("rep-deactivate").onclick = async (e)=>{
      e.preventDefault();
      if(!r.listing_id){ alert("No listing id on report."); return; }
      const reason = $("rep-action-reason").value.trim();
      if(!reason){ alert("Please enter a reason to email the owner."); return; }
      const f = new FormData();
      f.append("reason", reason);
      try{
        await API.postForm(`/api/admin/reports/${r.id}/deactivate`, f);
        dlg.close();
        await loadReports();
        alert("Listing deactivated and owner notified.");
      }catch(err){ alert(err.message || "Failed"); }
    };

    dlg.showModal();
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
        </div>
      `).join("");
    }catch(e){
      box.innerHTML = '<div class="muted">Banners section will be wired during payment step.</div>';
    }
  }

  function bindNav(){
    $("nav-reports").onclick = (e) => { e.preventDefault(); switchPanel("reports"); loadReports(); };
    $("nav-banners").onclick = (e) => { e.preventDefault(); switchPanel("banners"); loadBanners(); };
  }

  async function init(){
    const me = await AUTH.me();
    if(!ensureAdminGuard(me)) return;

    bindNav();

    switchPanel(location.hash === "#banners" ? "banners" : "reports");
    if (location.hash === "#banners") await loadBanners(); else await loadReports();
  }

  return { init };
})();