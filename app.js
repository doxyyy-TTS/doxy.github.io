// ===== CONFIG =====
const JSONBIN_KEY = '$2a$10$gteUzW8fw7st5fqwek7hKOLOkJoWWfjFNnS8HjX2uYkL/jH57FmCu';
const JSONBIN_ID  = '6a67480bda38895dfe95fed9';
const JSONBIN_URL = 'https://api.jsonbin.io/v3/b/' + JSONBIN_ID;

// ===== STATE =====
let posts = [];
let activePostId = null;
let pendingImages = [];

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

// ===== JSONBIN API =====
async function fetchPosts() {
  showStatus('> loading...');
  try {
    const res = await fetch(JSONBIN_URL + '/latest', {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });
    const data = await res.json();
    posts = Array.isArray(data.record) ? data.record : [];
    // Remove init post if it's the only one
    if (posts.length === 1 && posts[0].id === 1 && posts[0].username === 'system') {
      posts = [];
    }
  } catch (e) {
    posts = [];
  }
  renderSidebar();
  if (posts.length > 0) selectPost(posts[posts.length - 1].id);
  else showStatus('> No posts yet. Be the first!');
}

async function savePosts() {
  await fetch(JSONBIN_URL, {
    method: 'PUT',
    headers: {
      'X-Master-Key': JSONBIN_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(posts)
  });
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

  const sorted = [...filtered].reverse();

  sorted.forEach(post => {
    const tab = document.createElement('div');
    tab.className = 'post-tab' + (post.id === activePostId ? ' active' : '');
    tab.dataset.id = post.id;
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

  const images = post.images && post.images.length
    ? post.images
    : (post.image ? [post.image] : []);

  const imagesHtml = images.length
    ? `<div class="post-images ${images.length === 1 ? 'single' : ''}">
        ${images.map(src => `<img src="${src}" alt="post image" />`).join('')}
       </div>`
    : '';

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
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

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
  const files = Array.from(modalImage.files);
  let loaded = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      pendingImages.push(e.target.result);
      loaded++;
      if (loaded === files.length) {
        renderPreviews();
        modalImage.value = '';
      }
    };
    reader.readAsDataURL(file);
  });
});

function renderPreviews() {
  imagePreviews.innerHTML = '';
  pendingImages.forEach((src, idx) => {
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.innerHTML = `
      <img src="${src}" alt="preview" />
      <span class="remove-img" data-idx="${idx}">✕</span>
    `;
    item.querySelector('.remove-img').addEventListener('click', () => {
      pendingImages.splice(idx, 1);
      renderPreviews();
    });
    imagePreviews.appendChild(item);
  });
}

// ===== SUBMIT POST =====
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
    id: Date.now(),
    username,
    title: title || '(no title)',
    content,
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
searchInput.addEventListener('input', () => {
  renderSidebar(searchInput.value);
});

// ===== UTILS =====
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== INIT =====
fetchPosts();
