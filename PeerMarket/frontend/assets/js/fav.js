window.FAV = (() => {
  const state = { items: [] };

  function qs(id){ return document.getElementById(id); }
  function esc(s){ return (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }
  function fmt(n){ return new Intl.NumberFormat('mn-MN').format(Math.round(+n||0)); }

  function cardTemplate(l){
    const img = (l.images && l.images[0]) ? `<img src="${l.images[0]}" alt="">`
              : `<div style="width:100%;height:160px;border-radius:8px;background:#f2f2f2"></div>`;
    return `
      <div class="card">
        ${img}
        <h4><a href="/listing.html?id=${l.id}">${esc(l.title)}</a></h4>
        <div class="meta">${fmt(l.price)} ₮ • ${esc(l.city||"")}</div>
        <button data-id="${l.id}" class="remove">Remove</button>
      </div>
    `;
  }

  async function load(){
    try{
      const r = await API.get("/api/me/favorites");
      state.items = r.items || [];
      const box = qs('results'); box.innerHTML = "";
      if(!state.items.length){
        qs('empty').style.display = "";
        return;
      }
      qs('empty').style.display = "none";
      box.innerHTML = state.items.map(cardTemplate).join("");
    }catch(err){
      alert(err.message || "Failed to load favorites");
    }
  }

  function attachEvents(){
    qs('results').addEventListener('click', async (e) => {
      if(e.target.classList.contains('remove')){
        const id = e.target.getAttribute('data-id');
        try{
          await API.del("/api/me/favorites/" + id);
          await load();
        }catch(err){
          alert(err.message || "Remove failed");
        }
      }
    });
  }

  async function init(){
    attachEvents();
    await load();
  }

  return { init };
})();