window.FAV_PAGE = (() => {
  const $ = (id) => document.getElementById(id);
  const money = (x)=> new Intl.NumberFormat('mn-MN').format(Math.round(+x||0));

  function normalizeItems(items){
    if (!Array.isArray(items)) return [];
    return items.map(x => x.listing ? x.listing : x);
  }

  function card(item){
    const img = (item.images && item.images[0]) ? item.images[0] : "";
    const el = document.createElement('div');
    el.className = "card fav-card";
    el.innerHTML = `
      <a href="/listing.html?id=${item.id}">
        ${img ? `<img src="${img}" alt="">` : ""}
        <h4 style="margin:8px 0 4px">${item.title || ""}</h4>
        <div class="muted">${item.city || ""}</div>
        <div style="margin-top:6px;font-weight:700">${money(item.price)} ₮</div>
      </a>
      <div class="actions">
        <button data-id="${item.id}" class="unfav">Remove</button>
      </div>
    `;
    return el;
  }

  async function load(){
    const grid = $("grid");
    grid.innerHTML = "";
    $("empty").style.display = "none";
    try{
      const r = await API.get("/api/favorites");
      const items = normalizeItems(r.items);
      if (!items.length){
        $("empty").style.display = "block";
        return;
      }
      items.forEach(it => grid.appendChild(card(it)));
      grid.querySelectorAll("button.unfav").forEach(btn => {
        btn.onclick = async () => {
          try{
            await API.del("/api/favorites/" + btn.dataset.id);
            btn.closest(".fav-card").remove();
            if (!grid.children.length) $("empty").style.display = "block";
          }catch(e){
            alert(e.message || "Failed to remove.");
          }
        };
      });
    }catch(e){
      $("empty").style.display = "block";
      $("empty").textContent = "Failed to load favorites.";
    }
  }

  async function init(){
    await load();
  }

  return { init };
})();