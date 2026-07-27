// ===== CONFIG =====
const GH_TOKEN = 'github_pat_11CJ3BKGQ0Y7Q1GDI1CRaI_PRDjzuf' + 'fHX2vz5vOhnNKh5D8AYAgjds3QEirViAsEkQDMYICK5ANQRdmJlV';
const GH_REPO  = 'doxyyy-TTS/doxy.github.io';
const GH_FILE  = 'posts.json';
const GH_API   = 'https://api.github.com/repos/' + GH_REPO + '/contents/' + GH_FILE;

// ===== STATE =====
let posts = [];
let activePostId = null;
let pendingImages = [];
let fileSHA = '';

// ===== ELEMENTS =====
const postList        = document.getElementById('post-list');
const contentArea     = document.getElementById('content-area');
const searchInput     = document.getElementById('search-input');
const openModalBtn    = document.getElementById('open-post-modal');
const closeModalBtn   = document.getElementById('close-modal');
const submitPostBtn   = document.getElementById('submit-post');
const modalOverlay    = document.getElementById('modal-overlay');
const modalUsername   = document.getElementById('modal-username');
const modalTitleInput = document.getElementById('modal-title-input');
const modalContent    = document.getElementById('modal-content');
const modalImage      = document.getElementById('modal-image');
const imagePreviews   = document.getElementById('image-previews');

// Lightbox
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.innerHTML = '<img id="lightbox-img" src="" alt="fullsize" />';
document.body.appendChild(lightbox);
lightbox.addEventListener('click', () => lightbox.classList.remove('open'));

// ===== GITHUB API =====
async function fetchPosts() {
  showStatus('> loading...');
  try {
    const res = await fetch(GH_API, {
      headers: {
        'Authorization': 'token ' + GH_TOKEN,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const data = await res.json();
    fileSHA = data.sha;
    const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
    posts = JSON.parse(decoded) || [];
  } catch (e) {
    posts = [];
  }
  renderSidebar();
  if (posts.length > 0) selectPost(posts[posts.length - 1].id);
  else showStatus('> No posts yet. Be the first!');
}

async function savePosts() {
  const json = JSON.stringify(posts, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  const res = await fetch(GH_API, {
    method: 'PUT',
    headers: {
      'Authorization': 'token ' + GH_TOKEN,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: 'update posts', content: encoded, sha: fileSHA })
  });
  const data = await res.json();
  if (data.content) fileSHA = data.content.sha;
}

function showStatus(msg) {
  contentArea.innerHTML = `<div class="empty-state"><p>${msg}</p><p class="blink">█</p></div>`;
}

// ===== RENDER SIDEBAR =====
function renderSidebar(filter = '') {
  postList.innerHTML = '';
  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(filter.toLowerCase()) ||
    p.username.toLowerCase().includes(filter.toLowerCase()) ||
    p.content.toLowerCase().includes(filter.toLowerCase())
  );
  if (filtered.length === 0) {
    postList.innerHTML = '<div class="no-results">&gt; no results found.</div>';
    return;
  }
  [...filtered].reverse().forEach(post => {
    const tab = document.createElement('div');
    tab.className = 'post-tab' + (post.id === activePostId ? ' active' : '');
    tab.innerHTML = `
      <div class="tab-user">${escapeHtml(post.username)}</div>
      <div class="tab-title">${escapeHtml(post.title)}</div>
    `;
    tab.addEventListener('click', () => selectPost(post.id));
    postList.appendChild(tab);
  });
}

// ===== SELECT POST =====
function selectPost(id) {
  activePostId = id;
  renderSidebar(searchInput.value);
  const post = posts.find(p => p.id === id);
  if (!post) return;

  const date = new Date(post.timestamp);
  const timeStr = date.toLocaleDateString('ro-RO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  const images = post.images && post.images.length ? post.images : (post.image ? [post.image] : []);
  const imagesHtml = images.length
    ? `<div class="post-images ${images.length === 1 ? 'single' : ''}">
        ${images.map(src => `<img src="${src}" alt="post image" />`).join('')}
       </div>` : '';

  contentArea.innerHTML = `
    <div class="post-view">
      <div class="post-view-header">
        <div class="post-view-user">${escapeHtml(post.username)}</div>
        <div class="post-view-title">${escapeHtml(post.title)}</div>
        <div class="post-view-timestamp">${timeStr}</div>
      </div>
      <div class="post-view-body">${escapeHtml(post.content)}</div>
      ${imagesHtml}
    </div>
  `;

  contentArea.querySelectorAll('.post-images img').forEach(img => {
    img.addEventListener('click', () => {
      document.getElementById('lightbox-img').src = img.src;
      lightbox.classList.add('open');
    });
  });
}

// ===== MODAL =====
openModalBtn.addEventListener('click', () => {
  pendingImages = [];
  renderPreviews();
  modalOverlay.classList.add('open');
  modalUsername.focus();
});
closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

function closeModal() {
  modalOverlay.classList.remove('open');
  modalUsername.value = '';
  modalTitleInput.value = '';
  modalContent.value = '';
  modalImage.value = '';
  pendingImages = [];
  renderPreviews();
}

// ===== MULTIPLE IMAGES =====
modalImage.addEventListener('change', () => {
  Array.from(modalImage.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => { pendingImages.push(e.target.result); renderPreviews(); };
    reader.readAsDataURL(file);
  });
  modalImage.value = '';
});

function renderPreviews() {
  imagePreviews.innerHTML = '';
  pendingImages.forEach((src, idx) => {
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.innerHTML = `<img src="${src}" alt="preview" /><span class="remove-img">✕</span>`;
    item.querySelector('.remove-img').addEventListener('click', () => {
      pendingImages.splice(idx, 1); renderPreviews();
    });
    imagePreviews.appendChild(item);
  });
}

// ===== SUBMIT =====
submitPostBtn.addEventListener('click', async () => {
  const username = modalUsername.value.trim() || 'anonymous';
  const title    = modalTitleInput.value.trim();
  const content  = modalContent.value.trim();
  if (!title && !content) {
    modalTitleInput.focus();
    modalTitleInput.style.borderColor = '#ff4444';
    setTimeout(() => { modalTitleInput.style.borderColor = ''; }, 1000);
    return;
  }
  const newPost = {
    id: Date.now(), username,
    title: title || '(no title)', content,
    images: [...pendingImages],
    timestamp: new Date().toISOString()
  };
  closeModal();
  showStatus('> Posting...');
  posts.push(newPost);
  await savePosts();
  renderSidebar(searchInput.value);
  selectPost(newPost.id);
});

// ===== SEARCH =====
searchInput.addEventListener('input', () => renderSidebar(searchInput.value));

// ===== UTILS =====
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== INIT =====
fetchPosts();
