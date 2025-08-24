window.UI = (() => {
  function money(x){ return new Intl.NumberFormat('mn-MN').format(Math.round(x)); }
  function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }

  function listingCard(item){
    const img = (item.images && item.images[0]) ? item.images[0] : "";
    return el(`
      <a class="card" href="/listing.html?id=${item.id}">
        ${img ? `<img src="${img}" alt="" style="width:100%;height:160px;object-fit:cover;border-radius:8px">` : ""}
        <h4 style="margin:8px 0 4px">${item.title}</h4>
        <div class="muted">${item.city || ""}</div>
        <div style="margin-top:6px;font-weight:700">${money(item.price)} ₮</div>
      </a>
    `);
  }

  async function renderBanner(side, mount){
    if (!mount) return;
    try{
      const r = await API.get(`/api/banners/serve?position=${side}`);
      if (!r.banner) { mount.style.display = "none"; mount.innerHTML = ""; return; }
      const b = r.banner;
      mount.style.display = "block";
      mount.innerHTML = `
        <a href="${b.target_click_url}" target="_blank" rel="noopener">
          <img src="${b.image_url}" alt="ad" style="display:block;width:100%;height:auto;border-radius:8px;border:1px solid #eee">
        </a>`;
    }catch{
      mount.style.display = "none";
      mount.innerHTML = "";
    }
  }

  function header(){
    return `
      <header>
        <div class="container" style="display:flex;justify-content:space-between;align-items:center">
          <a href="/index.html" style="font-weight:800">PeerMarket</a>
          <nav id="nav-links"></nav>
        </div>
      </header>`;
  }

  async function bootHeader(active){
    document.body.insertAdjacentHTML("afterbegin", header());

    const nav = document.getElementById("nav-links");
    const u = await AUTH.me();

    if (u && u.is_admin) {
      const onBanners = location.pathname.endsWith("/admin_banners.html") || location.hash === "#banners";
      nav.innerHTML = `
        <a href="/admin_banners.html" ${onBanners ? 'class="active"':''}>Banners</a>
        <a href="#" id="nav-logout">Logout</a>
      `;
    } else {
      nav.innerHTML = `
        <a href="/index.html" ${active==='home'?'class="active"':''}>Browse</a>
        <a href="/post.html" ${active==='post'?'class="active"':''}>Post</a>
        <a href="/banner_post.html" ${active==='banner'?'class="active"':''}>Banner</a>
        <a href="/favorites.html" ${active==='fav'?'class="active"':''}>Favorites</a>
        <a href="/my.html" ${active==='my'?'class="active"':''}>My</a>
        ${u
          ? `<a href="/my.html" id="nav-login">${u.email}</a><a href="#" id="nav-logout">Logout</a>`
          : `<a href="/login.html" id="nav-login">Login</a>`
        }
      `;
    }

    const logout = document.getElementById("nav-logout");
    logout?.addEventListener('click', (e)=>{
      e.preventDefault();
      AUTH.clearToken();
      location.href="/index.html"; 
    });
  }

  function footer(){
    return `<footer><div class="container">P2P listings. We don’t handle transactions.</div></footer>`;
  }

  function mountFooter(){ document.body.insertAdjacentHTML("beforeend", footer()); }

  return { listingCard, renderBanner, bootHeader, mountFooter };
})();