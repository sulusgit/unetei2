window.HOME = (() => {
  let state = {
    q: "",
    category_id: "",
    city: "",
    min_price: "",
    max_price: "",
    sort: "newest",
    page: 1,
    page_size: 24,
  };

  const $ = (id) => document.getElementById(id);

  function val(id){ const el = $(id); return el ? el.value.trim() : ""; }
  function setVal(id, v){ const el = $(id); if (el) el.value = v; }

  function readControls(){
    state.q = val('q');
    state.sort = val('sort') || "newest";
    state.category_id = val('category');
    state.city = val('city');
    state.min_price = val('min_price');
    state.max_price = val('max_price');
  }

  function writeFromURL(){
    const p = new URLSearchParams(location.search);
    state.q = p.get('q') || "";
    state.sort = p.get('sort') || "newest";
    state.category_id = p.get('category_id') || "";
    state.city = p.get('city') || "";
    state.min_price = p.get('min_price') || "";
    state.max_price = p.get('max_price') || "";
    state.page = parseInt(p.get('page') || "1", 10);

    setVal('q', state.q);
    setVal('sort', state.sort);
    setVal('category', state.category_id);
    setVal('city', state.city);
    setVal('min_price', state.min_price);
    setVal('max_price', state.max_price);
  }

  function pushURL(){
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.category_id) p.set('category_id', state.category_id);
    if (state.city) p.set('city', state.city);
    if (state.min_price) p.set('min_price', state.min_price);
    if (state.max_price) p.set('max_price', state.max_price);
    if (state.sort && state.sort !== 'newest') p.set('sort', state.sort);
    if (state.page > 1) p.set('page', String(state.page));
    history.replaceState(null, "", "/index.html" + (p.toString() ? ("?" + p.toString()) : ""));
  }

  async function loadCategories(){
    const sel = $('category');
    if (!sel) return;
    sel.innerHTML = `<option value="">All categories</option>`;
    try{
      const cats = await API.get("/api/categories");
      sel.innerHTML += cats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    }catch(e){ }
  }

  function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }

  let lastMeta = { page:1, pages:1 };

  async function load(page=1){
    state.page = page;
    pushURL();

    const results = $('results');
    const info = $('pageinfo');
    const prevBtn = $('prev');
    const nextBtn = $('next');

    if (results) results.innerHTML = `<div class="muted">Loading...</div>`;
    if (info) info.textContent = "";
    if (prevBtn && nextBtn) prevBtn.disabled = nextBtn.disabled = true;

    const url = new URL(location.origin + "/api/listings");
    if (state.q) url.searchParams.set('q', state.q);
    if (state.category_id) url.searchParams.set('category_id', state.category_id);
    if (state.city) url.searchParams.set('city', state.city);
    if (state.min_price) url.searchParams.set('min_price', state.min_price);
    if (state.max_price) url.searchParams.set('max_price', state.max_price);
    url.searchParams.set('sort', state.sort);
    url.searchParams.set('page', state.page);
    url.searchParams.set('page_size', state.page_size);

    try{
      const data = await API.get(url.pathname + "?" + url.searchParams.toString());
      if (results){
        results.innerHTML = "";
        if (!data.items.length){
          results.innerHTML = `<div class="muted" style="padding:8px">No results</div>`;
        } else {
          data.items.forEach(item => results.appendChild(UI.listingCard(item)));
        }
      }
      lastMeta = data.meta || { page:1, pages:1 };
      if (info) info.textContent = `Page ${lastMeta.page} / ${lastMeta.pages}`;
      if (prevBtn) prevBtn.disabled = lastMeta.page <= 1;
      if (nextBtn) nextBtn.disabled = lastMeta.page >= lastMeta.pages;
    }catch(e){
      if (results) results.innerHTML = `<div class="muted">Failed to load results</div>`;
      console.error(e);
    }
  }

  function attachHandlers(){
    const go = $('go'); if (go) go.onclick = () => { readControls(); load(1); };
    const q = $('q'); if (q) q.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ readControls(); load(1);} });

    ['category','sort','city','min_price','max_price'].forEach(id => {
      const el = $(id); if(!el) return;
      el.addEventListener('change', () => { readControls(); load(1); });
    });

    const prevBtn = $('prev'); if (prevBtn) prevBtn.onclick = ()=>{ if (lastMeta.page > 1) load(lastMeta.page - 1); };
    const nextBtn = $('next'); if (nextBtn) nextBtn.onclick = ()=>{ if (lastMeta.page < lastMeta.pages) load(lastMeta.page + 1); };
  }

  async function init(){
    await loadCategories();
    writeFromURL();
    attachHandlers();
    await load(state.page);
  }

  return { init };
})();