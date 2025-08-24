window.POST_PAGE = (() => {
  let files = []; 

  function setHint(msg){ document.getElementById('hint').textContent = msg || ""; }

  async function loadCategories(){
    const sel = document.getElementById('category');
    sel.innerHTML = `<option value="">Loading...</option>`;
    try{
      const cats = await API.get("/api/categories");
      sel.innerHTML = `<option value="">Select a category</option>` + cats.map(c =>
        `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    }catch(e){
      sel.innerHTML = `<option value="">(failed to load)</option>`;
      console.error(e);
    }
  }

  function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }

  function renderThumbs(){
    const box = document.getElementById('thumbs');
    box.innerHTML = "";
    files.forEach((f, i) => {
      const url = URL.createObjectURL(f);
      const wrap = document.createElement('div');
      wrap.className = "thumb";
      wrap.innerHTML = `<img src="${url}" alt=""><button title="remove">×</button>`;
      wrap.querySelector('button').onclick = () => { files.splice(i,1); renderThumbs(); };
      box.appendChild(wrap);
    });
  }

  function onFileInput(e){
    const incoming = Array.from(e.target.files || []);
    const valid = incoming.filter(f =>
      /^image\/(jpeg|png|webp)$/.test(f.type) && f.size <= 5*1024*1024
    );
    if (valid.length < incoming.length){
      alert("Some files were ignored (type or size not allowed).");
    }
    const room = Math.max(0, 8 - files.length);
    files = files.concat(valid.slice(0, room));
    if (valid.length > room){
      alert("Max 8 images per listing.");
    }
    e.target.value = "";
    renderThumbs();
  }

  function validate(){
    const title = document.getElementById('title').value.trim();
    const price = document.getElementById('price').value.trim();
    const category = document.getElementById('category').value;
    const city = document.getElementById('city').value.trim();
    const desc = document.getElementById('desc').value.trim();

    if (!title) return "Title is required";
    if (title.length > 140) return "Title too long (max 140)";
    if (desc.length > 5000) return "Description too long (max 5000)";
    if (price && (+price < 0)) return "Price must be ≥ 0";
    if (files.length > 8) return "Max 8 images";
    return null;
  }

  async function submit(){
    const err = validate();
    if (err){ alert(err); return; }

    const f = new FormData();
    f.append("title", document.getElementById('title').value.trim());
    f.append("description", document.getElementById('desc').value.trim());
    const priceVal = document.getElementById('price').value.trim();
    if (priceVal) f.append("price", priceVal);
    const cat = document.getElementById('category').value;
    if (cat) f.append("category_id", cat);
    const city = document.getElementById('city').value.trim();
    if (city) f.append("city", city);
    files.forEach(file => f.append("images", file));

    try{
      setHint("Uploading...");
      const r = await API.postForm("/api/listings", f);
      setHint("");
      location.href = "/listing.html?id=" + r.id;
    }catch(e){
      setHint("");
      alert(e.message || "Upload failed");
    }
  }

  function resetForm(){
    files = [];
    renderThumbs();
    document.getElementById('title').value = "";
    document.getElementById('price').value = "";
    document.getElementById('category').value = "";
    document.getElementById('city').value = "";
    document.getElementById('desc').value = "";
    setHint("");
  }

  function attach(){
    document.getElementById('images').addEventListener('change', onFileInput);
    document.getElementById('submit').addEventListener('click', submit);
    document.getElementById('reset').addEventListener('click', (e)=>{ e.preventDefault(); resetForm(); });
  }

  async function init(){
    await loadCategories();
    attach();
  }

  return { init };
})();