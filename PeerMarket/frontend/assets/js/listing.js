window.LISTING = (() => {
  const state = { listing: null, isFav: false };

  const qs = (id) => document.getElementById(id);
  const fmtMoney = (x) => new Intl.NumberFormat('mn-MN').format(Math.round(+x || 0));
  const fmtDate = (s) => { try { return new Date(s).toLocaleDateString(); } catch { return ""; } };
  const esc = (s) => (s || "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));

  function getId(){
    const id = new URLSearchParams(location.search).get("id");
    if(!id){ alert("Missing id"); throw new Error("missing id"); }
    return id;
  }

  async function loadListing(id){
    return API.get("/api/listings/" + id);
  }

  function renderGallery(images){
    const main = qs('g-main');
    const thumbs = qs('g-thumbs');
    thumbs.innerHTML = "";
    if(!images || !images.length){
      main.innerHTML = `<div class="muted">No image</div>`;
      return;
    }
    function setActive(idx){
      main.innerHTML = `<img src="${images[idx]}" alt="">`;
      [...thumbs.querySelectorAll('img')].forEach((img,i)=> img.classList.toggle('active', i===idx));
    }
    images.forEach((src, i) => {
      const im = document.createElement('img');
      im.src = src; im.alt = "";
      im.onclick = () => setActive(i);
      thumbs.appendChild(im);
    });
    setActive(0);
  }

  async function tryFetchFavoritesMap(){
    const me = await AUTH.me();        
    if(!me) return null;
    try{
      const r = await API.get("/api/favorites");
      return new Set(r.items.map(x => x.id));
    }catch{
      return null;
    }
  }

  function setFavButton(on){
    state.isFav = !!on;
    const btn = qs('fav-btn');
    if(on){
      btn.textContent = "★ Favorited";
      btn.classList.add("primary");
    }else{
      btn.textContent = "♡ Favorite";
      btn.classList.remove("primary");
    }
  }

  async function toggleFavorite(){
    const me = await AUTH.me();
    if(!me){
      const back = encodeURIComponent(location.pathname + location.search);
      location.href = "/login.html?next=" + back;
      return;
    }
    const id = state.listing.id;
    try{
      if(state.isFav){
        await API.del("/api/favorites/" + id);
        setFavButton(false);
      }else{
        await API.postForm("/api/favorites/" + id, new FormData());
        setFavButton(true);
      }
    }catch(e){
      alert(e.message || "Favorite action failed");
    }
  }

  function openReportDialog(){
    const dlg   = qs('dlg-report');
    const send  = qs('rep-send');
    const cancel= qs('rep-cancel');
    const box   = qs('rep-reason');
    if (!dlg) return;

    box.value = "";
    dlg.showModal();

    cancel.onclick = (e) => { e.preventDefault(); dlg.close(); };

    const onCancel = (e) => { e.preventDefault(); dlg.close(); };
    dlg.addEventListener('cancel', onCancel, { once: true });

    send.onclick = async (e) => {
      e.preventDefault();
      const me = await AUTH.me();
      if(!me){
        const back = encodeURIComponent(location.pathname + location.search);
        dlg.close();
        location.href = "/login.html?next=" + back;
        return;
      }
      send.disabled = true;
      try{
        const f = new FormData();
        f.append("listing_id", state.listing.id);
        f.append("reason", (box.value || "").slice(0,1000));
        await API.postForm("/api/reports", f);
        dlg.close();
        alert("Thanks, we received your report.");
      }catch(err){
        alert(err.message || "Report failed");
      }finally{
        send.disabled = false;
      }
    };
  }

  async function loadRelated(category_id, excludeId){
    if(!category_id) return [];
    const url = new URL(location.origin + "/api/listings");
    url.searchParams.set("category_id", category_id);
    url.searchParams.set("page_size", "6");
    const data = await API.get(url.pathname + "?" + url.searchParams.toString());
    return data.items.filter(x => x.id !== +excludeId).slice(0, 6);
  }

  async function init(){
    const id = getId();
    const data = await loadListing(id);
    state.listing = data;

    qs('title').textContent   = data.title || "Untitled";
    qs('city').textContent    = data.city ? esc(data.city) : "City n/a";
    qs('created').textContent = fmtDate(data.created_at);
    qs('status').textContent  = data.status && data.status !== 'active' ? `(${data.status})` : "";
    qs('price').textContent   = fmtMoney(data.price);
    qs('desc').textContent    = data.description || "";
    qs('lid').textContent     = data.id;
    qs('cat').textContent     = data.category_id || "—";
    qs('expires').textContent = data.expires_at ? fmtDate(data.expires_at) : "—";

    const owner = data.owner || {};
    const ownerName  = owner.name  || '—';
    const ownerEmail = owner.email || '—';
    const ownerPhone = owner.phone || '—';
    const set = (id, val) => { const el = qs(id); if (el) el.textContent = val; };
    set('owner-name',  ownerName);
    set('owner-email', ownerEmail);
    set('owner-phone', ownerPhone);

    renderGallery(data.images || []);

    try{
      const favSet = await tryFetchFavoritesMap();
      setFavButton(!!(favSet && favSet.has(data.id)));
    }catch{ setFavButton(false); }

    qs('fav-btn').onclick    = toggleFavorite;
    qs('report-btn').onclick = openReportDialog;

    try{
      const rel = await loadRelated(data.category_id, data.id);
      const box = qs('related'); box.innerHTML = "";
      if(!rel.length){
        box.innerHTML = `<div class="muted">No related items</div>`;
      }else{
        rel.forEach(item => box.appendChild(UI.listingCard(item)));
      }
    }catch(e){
      console.error("related failed", e);
    }
  }

  return { init };
})();