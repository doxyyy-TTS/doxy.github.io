// ===== STATE =====
let posts = [];
let activePostId = null;

// ===== ELEMENTS =====
const postList       = document.getElementById('post-list');
const contentArea    = document.getElementById('content-area');
const searchInput    = document.getElementById('search-input');
const openModalBtn   = document.getElementById('open-post-modal');
const closeModalBtn  = document.getElementById('close-modal');
const submitPostBtn  = document.getElementById('submit-post');
const modalOverlay   = document.getElementById('modal-overlay');
const modalUsername  = document.getElementById('modal-username');
const modalTitle     = document.getElementById('modal-title');
const modalContent   = document.getElementById('modal-content');
const modalImage     = document.getElementById('modal-image');
const btnMinimize    = document.getElementById('btn-minimize');
const btnMaximize    = document.getElementById('btn-maximize');
const btnClose       = document.getElementById('btn-close');

// ===== LOAD FROM LOCALSTORAGE =====
function loadPosts() {
  const saved = localStorage.getItem('tts_posts');
  if (saved) {
    posts = JSON.parse(saved);
  } else {
    // Demo posts
    posts = [
      {
        id: 1,
        username: 'root',
        title: 'Welcome to TERMINAL://SOCIAL',
        content: 'This is a terminal-themed social platform.\nPost text, images, and more.\nUse the [ + POST ] button to get started.',
        image: null,
        timestamp: new Date('2026-07-27T10:00:00').toISOString()
      },
      {
        id: 2,
        username: 'alex99',
        title: 'First post here!',
        content: 'Salut tuturor! Tocmai am descoperit acest site.\nSe pare ca e destul de interesant.',
        image: null,
        timestamp: new Date('2026-07-27T11:30:00').toISOString()
      },
      {
        id: 3,
        username: 'dev_null',
        title: 'How to exit vim',
        content: ':q!\n\nYou\'re welcome.',
        image: null,
        timestamp: new Date('2026-07-27T12:00:00').toISOString()
      }
    ];
    savePosts();
  }
}

function savePosts() {
  localStorage.setItem('tts_posts', JSON.stringify(posts));
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

  // Newest first
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

  contentArea.innerHTML = `
    <div class="post-view">
      <div class="post-view-header">
        <div class="post-view-user">${escapeHtml(post.username)}</div>
        <div class="post-view-title">${escapeHtml(post.title)}</div>
        <div class="post-view-timestamp">${timeStr}</div>
      </div>
      <div class="post-view-body">${escapeHtml(post.content)}</div>
      ${post.image ? `<img class="post-view-image" src="${post.image}" alt="post image" />` : ''}
    </div>
  `;
}

// ===== MODAL =====
openModalBtn.addEventListener('click', () => {
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
  modalTitle.value = '';
  modalContent.value = '';
  modalImage.value = '';
}

submitPostBtn.addEventListener('click', () => {
  const username = modalUsername.value.trim() || 'anonymous';
  const title    = modalTitle.value.trim();
  const content  = modalContent.value.trim();

  if (!title && !content) {
    modalTitle.focus();
    modalTitle.style.borderColor = '#ff4444';
    setTimeout(() => modalTitle.style.borderColor = '', 1000);
    return;
  }

  const file = modalImage.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      createPost(username, title || '(no title)', content, e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    createPost(username, title || '(no title)', content, null);
  }
});

function createPost(username, title, content, imageData) {
  const newPost = {
    id: Date.now(),
    username,
    title,
    content,
    image: imageData,
    timestamp: new Date().toISOString()
  };

  posts.push(newPost);
  savePosts();
  closeModal();
  renderSidebar(searchInput.value);
  selectPost(newPost.id);
}

// ===== SEARCH =====
searchInput.addEventListener('input', () => {
  renderSidebar(searchInput.value);
});

// ===== TITLE BAR CONTROLS =====
btnClose.addEventListener('click', () => {
  document.querySelector('.window').style.display = 'none';
});

btnMinimize.addEventListener('click', () => {
  const main = document.querySelector('.main');
  const topBar = document.querySelector('.top-bar');
  const isMinimized = main.style.display === 'none';
  main.style.display = isMinimized ? '' : 'none';
  topBar.style.display = isMinimized ? '' : 'none';
});

btnMaximize.addEventListener('click', () => {
  const win = document.querySelector('.window');
  if (win.style.width === '100vw') {
    win.style.width = '';
    win.style.height = '';
    win.style.border = '';
  } else {
    win.style.width = '100vw';
    win.style.height = '100vh';
    win.style.border = 'none';
  }
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
loadPosts();
renderSidebar();
if (posts.length > 0) {
  // Select most recent post on load
  selectPost(posts[posts.length - 1].id);
}
