window.MY = (() => {
  const state = {
    page: 1, page_size: 10, status: "",
    items: [],
    editId: null,
    imgListingId: null,
  };

  function qs(id){ return document.getElementById(id); }
  function esc(s){ return (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }
  function fmt(n){ return new Intl.NumberFormat('mn-MN').format(Math.round(+n||0)); }
  function fmtDate(s){ try{return new Date(s).toLocaleDateString();}catch{return "";} }

  function rowTemplate(l){
    const img = (l.images && l.images[0]) ? `<img src="${l.images[0]}" alt="">` : `<div style="width:120px;height:90px;border-radius:8px;background:#f2f2f2"></div>`;
    return `
      <div class="row" data-id="${l.id}">
        ${img}
        <div>
          <h4><a href="/listing.html?id=${l.id}">${esc(l.title)}</a></h4>
          <div class="meta">
            <span>${fmt(l.price)} ₮</span> • 
            <span>${esc(l.city||"")}</span> • 
            <span>Created ${fmtDate(l.created_at)}</span> • 
            <span>Status: <b>${l.status}</b></span> • 
            <span>Expires: ${l.expires_at ? fmtDate(l.expires_at) : "—"}</span>
          </div>
          <div class="actions">
            <button data-act="edit">Edit</button>
            <select data-act="status">
              <option value="">Set status…</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="archived">Archived</option>
            </select>
            <button data-act="renew">Renew +30d</button>
            <button data-act="images">Images</button>
            <button data-act="archive">Quick-archive</button>
          </div>
        </div>
      </div>
    `;
  }

  async function load(page=1){
    state.page = page;
    const status = qs('status').value;
    state.status = status;

    const p = new URLSearchParams();
    if (status) p.set('status', status);
    p.set('page', state.page);
    p.set('page_size', state.page_size);

    const r = await API.get("/api/me/listings?" + p.toString());
    const baseItems = r.items;
    const detailed = [];
    for (const it of baseItems){
      try {
        const full = await API.get("/api/listings/" + it.id);
        detailed.push(full);
      } catch {
        detailed.push({ ...it, images: [] });
      }
    }
    state.items = detailed;

    const rows = qs('rows'); rows.innerHTML = "";
    if (!detailed.length){
      rows.innerHTML = `<div class="card muted">No listings</div>`;
    }else{
      rows.innerHTML = detailed.map(rowTemplate).join("");
    }

    const pager = qs('pager'); pager.innerHTML = "";
    for (let pNum=1; pNum<=r.meta.pages; pNum++){
      const btn = document.createElement('button');
      btn.textContent = String(pNum);
      if (pNum === r.meta.page) btn.disabled = true;
      btn.onclick = () => load(pNum);
      pager.appendChild(btn);
    }
  }

  function attachToolbar(){
    qs('status').onchange = () => load(1);
    qs('refresh').onclick = () => load(state.page);
  }

  function attachRowActions(){
    qs('rows').addEventListener('click', async (e) => {
      const target = e.target;
      const row = target.closest('.row');
      if(!row) return;
      const id = row.getAttribute('data-id');

      if (target.matches('button[data-act="edit"]')){
        openEdit(id);
      }
      if (target.matches('button[data-act="renew"]')){
        await renew(id);
      }
      if (target.matches('button[data-act="images"]')){
        openImages(id);
      }
      if (target.matches('button[data-act="archive"]')){
        await quickArchive(id);
      }
    });

    qs('rows').addEventListener('change', async (e) => {
      const sel = e.target;
      if (sel.matches('select[data-act="status"]')){
        const row = sel.closest('.row');
        const id = row.getAttribute('data-id');
        const status = sel.value;
        if(!status) return;
        await setStatus(id, status);
      }
    });
  }

  function currentItem(id){ return state.items.find(x => String(x.id) === String(id)); }

  function openEdit(id){
    const it = currentItem(id);
    if(!it) return;
    state.editId = id;
    qs('e-title').value = it.title || "";
    qs('e-price').value = it.price || "";
    qs('e-category').value = it.category_id || "";
    qs('e-city').value = it.city || "";
    qs('e-desc').value = it.description || "";
    const dlg = qs('dlg-edit');
    dlg.showModal();
  }

  function closeEdit(){ qs('dlg-edit').close(); state.editId = null; }

  function attachEditDialog(){
    qs('e-cancel').onclick = (e)=>{ e.preventDefault(); closeEdit(); };
    qs('e-save').onclick = async (e) => {
      e.preventDefault();
      const id = state.editId;
      if(!id) return;
      const f = new FormData();
      const t = qs('e-title').value.trim();
      if(!t){ alert("Title required"); return; }
      f.append("title", t);
      const d = qs('e-desc').value.trim();
      f.append("description", d);
      const p = qs('e-price').value.trim();
      if (p) f.append("price", p);
      const c = qs('e-category').value.trim();
      if (c) f.append("category_id", c);
      const city = qs('e-city').value.trim();
      if (city) f.append("city", city);
      try{
        await API.patchForm("/api/listings/" + id, f);
        closeEdit();
        await load(state.page);
      }catch(err){
        alert(err.message || "Save failed");
      }
    };
  }

  async function setStatus(id, status){
    const f = new FormData(); f.append("status", status);
    try{ await API.postForm(`/api/listings/${id}/status`, f); await load(state.page); }
    catch(e){ alert(e.message || "Failed to set status"); }
  }

  async function renew(id){
    try{ await API.postForm(`/api/listings/${id}/renew`, new FormData()); await load(state.page); }
    catch(e){ alert(e.message || "Renew failed"); }
  }

  async function quickArchive(id){
    if(!confirm("Archive this listing?")) return;
    try{ await API.del(`/api/listings/${id}`); await load(state.page); }
    catch(e){ alert(e.message || "Archive failed"); }
  }

  async function fetchImages(id){
    const full = await API.get("/api/listings/" + id);
    return full.images || [];
  }

  async function openImages(id){
    state.imgListingId = id;
    await renderImages();
    qs('dlg-images').showModal();
  }

  async function renderImages(){
    const id = state.imgListingId;
    const urls = await fetchImages(id);
    const box = qs('img-list'); box.innerHTML = "";
    if(!urls.length){
      box.innerHTML = `<div class="muted">No images</div>`;
      return;
    }
    urls.forEach((u) => {
      const wrap = document.createElement('div');
      wrap.className = "thumb";
      wrap.innerHTML = `<img src="${u}" alt="">`;
      box.appendChild(wrap);
    });
  }

  async function addImages(files){
    const id = state.imgListingId;
    if(!id || !files || !files.length) return;
    const f = new FormData();
    const incoming = Array.from(files).filter(f =>
      /^image\/(jpeg|png|webp)$/.test(f.type) && f.size <= 5*1024*1024
    );
    incoming.forEach(file => f.append("images", file));
    try{
      await API.postForm(`/api/listings/${id}/images`, f);
      await renderImages();
      await load(state.page);
    }catch(e){
      alert(e.message || "Add images failed");
    }
  }

  function attachImagesDialog(){
    qs('i-close').onclick = ()=>{ qs('dlg-images').close(); state.imgListingId = null; };
    qs('add-images').onchange = (e)=>{ addImages(e.target.files); e.target.value = ""; };
  }

  async function init(){
    attachToolbar();
    attachRowActions();
    attachEditDialog();
    attachImagesDialog();
    await load(1);
  }

  return { init };
})();