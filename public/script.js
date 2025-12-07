// API 配置
// 自动检测API地址：如果是本地开发使用localhost，否则使用当前域名
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : `${window.location.protocol}//${window.location.host}/api`;

// 上传文件路径配置
const UPLOADS_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/uploads'
    : `${window.location.protocol}//${window.location.host}/uploads`;

// 密码配置
const PASSWORDS = {
    male: 'sr',
    female: 'nxz'
};

// 状态管理
let currentUser = null;
let currentPage = 'home';
let currentPostType = '';
let currentPostId = null;
let selectedPhotos = [];

// 照片查看器状态
let currentPhotoList = [];
let currentPhotoIndex = 0;

// 分页状态
const ITEMS_PER_PAGE = 4;
let currentPageNum = {
    home: 1,
    thoughts: 1,
    articles: 1,
    gallery: 1
};
let totalPages = {
    home: 1,
    thoughts: 1,
    articles: 1,
    gallery: 1
};
let allData = {
    home: [],
    thoughts: [],
    articles: [],
    gallery: []
};

// 日历状态
let calendarDate = new Date();
let calendarData = [];

// 通知状态
let lastCheckTime = null;
let notificationCount = 0;
let notificationInterval = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadHomePage(); // 首页默认加载
    bindEvents();
    initMobileOptimizations();
    initBackToTop();
    updateHeaderDayCounter();
    // 每天更新一次计时器
    setInterval(updateHeaderDayCounter, 60000); // 每分钟检查一次
});

// 移动端优化
function initMobileOptimizations() {
    // 防止双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // 优化滚动性能
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('.modal-content') || e.target.closest('.detail-modal')) {
            // 允许模态框内滚动
            return;
        }
    }, { passive: true });
    
    // 检测是否为移动设备
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('mobile-device');
    }
}

// 返回顶部按钮
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    // 监听滚动事件
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    // 点击返回顶部
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 绑定事件
function bindEvents() {
    // 导航切换
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page) switchPage(page);
        });
    });

    // 登录按钮
    document.getElementById('loginBtn').addEventListener('click', () => {
        if (currentUser) {
            logout();
        } else {
            openLoginModal();
        }
    });

    // 新建按钮
    document.getElementById('newThoughtBtn').addEventListener('click', () => {
        openEditorModal('thoughts');
    });
    document.getElementById('newArticleBtn').addEventListener('click', () => {
        openEditorModal('articles');
    });
    document.getElementById('newAlbumBtn').addEventListener('click', () => {
        openAlbumModal();
    });

    // 模态框关闭
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal, .photo-viewer').style.display = 'none';
        });
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') || e.target.classList.contains('photo-viewer')) {
            e.target.style.display = 'none';
        }
    });

    // 登录相关
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('passwordInput').style.display = 'block';
            document.getElementById('submitLogin').style.display = 'block';
        });
    });

    document.getElementById('submitLogin').addEventListener('click', handleLogin);
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // 发布内容
    document.getElementById('submitPost').addEventListener('click', handleSubmitPost);

    // 发表评论
    document.getElementById('submitComment').addEventListener('click', handleSubmitComment);

    // 搜索按钮
    document.getElementById('searchBtn').addEventListener('click', openSearchModal);
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // 日历按钮
    document.getElementById('calendarBtn').addEventListener('click', openCalendarModal);
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));

    // 通知按钮
    document.getElementById('notificationBtn').addEventListener('click', openNotificationModal);

    // 相册上传
    const dropZone = document.getElementById('dropZone');
    const photoInput = document.getElementById('photoInput');

    dropZone.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', handlePhotoSelect);

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        handlePhotoFiles(files);
    });

    document.getElementById('submitAlbum').addEventListener('click', handleSubmitAlbum);

    // 照片查看器导航
    document.getElementById('photoPrev').addEventListener('click', prevPhoto);
    document.getElementById('photoNext').addEventListener('click', nextPhoto);
    
    // 键盘导航
    document.addEventListener('keydown', (e) => {
        const viewer = document.getElementById('photoViewer');
        if (viewer.style.display === 'block') {
            if (e.key === 'ArrowLeft') {
                prevPhoto();
            } else if (e.key === 'ArrowRight') {
                nextPhoto();
            } else if (e.key === 'Escape') {
                viewer.style.display = 'none';
            }
        }
    });
}

// 切换页面
function switchPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === page + 'Page');
    });
    
    if (page === 'home') {
        loadHomePage();
    } else if (page === 'gallery') {
        loadGallery();
    } else {
        loadPosts();
    }
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 登录处理
function handleLogin() {
    const selectedGender = document.querySelector('.gender-btn.selected');
    const password = document.getElementById('passwordInput').value;
    const errorEl = document.getElementById('loginError');

    if (!selectedGender) {
        errorEl.textContent = '请选择账号';
        return;
    }

    const gender = selectedGender.dataset.gender;
    if (password === PASSWORDS[gender]) {
        currentUser = gender;
        document.getElementById('loginModal').style.display = 'none';
        updateLoginStatus();
        errorEl.textContent = '';
        document.getElementById('passwordInput').value = '';
        document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('selected'));
    } else {
        errorEl.textContent = '密钥错误';
    }
}

// 登出
function logout() {
    currentUser = null;
    updateLoginStatus();
}

// 更新登录状态
function updateLoginStatus() {
    const loginBtn = document.getElementById('loginBtn');
    const notificationBtn = document.getElementById('notificationBtn');
    
    if (currentUser) {
        loginBtn.textContent = (currentUser === 'male' ? '♂' : '♀');
        loginBtn.classList.add('logged-in');
        document.getElementById('newThoughtBtn').style.display = 'block';
        document.getElementById('newArticleBtn').style.display = 'block';
        document.getElementById('newAlbumBtn').style.display = 'block';
        document.getElementById('commentForm').style.display = 'block';
        notificationBtn.style.display = 'block';
        
        // 登录后初始化通知
        // 从 localStorage 读取上次查看时间
        const storageKey = `lastCheckTime_${currentUser}`;
        const savedTime = localStorage.getItem(storageKey);
        
        if (savedTime) {
            lastCheckTime = savedTime;
        } else {
            // 首次登录，设置为很早的时间
            lastCheckTime = new Date('2000-01-01').toISOString();
        }
        
        checkNotifications();
        
        // 清除旧的定时器
        if (notificationInterval) {
            clearInterval(notificationInterval);
        }
        // 每30秒检查一次新通知
        notificationInterval = setInterval(checkNotifications, 30000);
    } else {
        loginBtn.textContent = '♂♀';
        loginBtn.classList.remove('logged-in');
        document.getElementById('newThoughtBtn').style.display = 'none';
        document.getElementById('newArticleBtn').style.display = 'none';
        document.getElementById('newAlbumBtn').style.display = 'none';
        document.getElementById('commentForm').style.display = 'none';
        notificationBtn.style.display = 'none';
        
        // 登出后清空通知
        notificationCount = 0;
        lastCheckTime = null;
        updateNotificationBadge();
        
        // 清除定时器
        if (notificationInterval) {
            clearInterval(notificationInterval);
            notificationInterval = null;
        }
    }
}

// 打开登录模态框
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('passwordInput').style.display = 'none';
    document.getElementById('submitLogin').style.display = 'none';
    document.getElementById('loginError').textContent = '';
}

// 打开编辑器模态框
function openEditorModal(type) {
    currentPostType = type;
    
    const modal = document.getElementById('editorModal');
    const title = document.getElementById('editorTitle');
    const postTitle = document.getElementById('postTitle');
    const postContent = document.getElementById('postContent');

    title.textContent = type === 'thoughts' ? '新碎碎念' : '新文章';
    
    if (type === 'thoughts') {
        postTitle.style.display = 'none';
        postTitle.value = '';
    } else {
        postTitle.style.display = 'block';
        postTitle.value = '';
    }
    
    postContent.value = '';
    modal.style.display = 'block';
}

// 提交内容
async function handleSubmitPost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();

    if (!content) {
        alert('请输入内容');
        return;
    }

    if (currentPostType === 'articles' && !title) {
        alert('请输入标题');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: currentPostType,
                author: currentUser,
                title: currentPostType === 'articles' ? title : '',
                content: content
            })
        });

        if (response.ok) {
            document.getElementById('editorModal').style.display = 'none';
            loadPosts();
        }
    } catch (error) {
        alert('发布失败: ' + error.message);
    }
}

// 加载首页（所有内容混合）
async function loadHomePage() {
    try {
        const [thoughtsRes, articlesRes, albumsRes] = await Promise.all([
            fetch(`${API_URL}/posts/thoughts`),
            fetch(`${API_URL}/posts/articles`),
            fetch(`${API_URL}/albums`)
        ]);
        
        const thoughts = await thoughtsRes.json();
        const articles = await articlesRes.json();
        const albums = await albumsRes.json();
        
        // 合并所有内容并添加类型标识
        const allContent = [
            ...thoughts.map(item => ({ ...item, contentType: 'thoughts' })),
            ...articles.map(item => ({ ...item, contentType: 'articles' })),
            ...albums.map(item => ({ ...item, contentType: 'gallery' }))
        ];
        
        // 按日期倒序排序
        allContent.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        allData.home = allContent;
        totalPages.home = Math.ceil(allContent.length / ITEMS_PER_PAGE);
        
        renderHomePage();
        renderPagination('home');
    } catch (error) {
        console.error('加载首页失败:', error);
    }
}

// 渲染首页
function renderHomePage() {
    const content = allData.home;
    const listEl = document.getElementById('homeList');
    
    if (content.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><p>还没有任何内容</p></div>';
        return;
    }
    
    const start = (currentPageNum.home - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageContent = content.slice(start, end);
    
    listEl.innerHTML = pageContent.map(item => {
        if (item.contentType === 'gallery') {
            // 渲染相册
            return `
                <div class="post-card gallery-card" onclick="openAlbumDetail(${item.id})">
                    ${currentUser && item.author === currentUser ? `
                        <div class="post-card-actions">
                            <button class="action-btn" onclick="event.stopPropagation(); editAlbum(${item.id})">✏️ 编辑</button>
                            <button class="action-btn" onclick="event.stopPropagation(); deleteAlbum(${item.id})">🗑️ 删除</button>
                        </div>
                    ` : ''}
                    <div class="post-header">
                        <span class="post-author">${item.author === 'male' ? '♂' : '♀'}</span>
                        <span class="content-type-badge">📷 相册</span>
                    </div>
                    <div class="home-gallery-preview">
                        ${item.photos.slice(0, 4).map(photo => `
                            <div class="home-gallery-photo">
                                <img src="${UPLOADS_URL}/${photo.filename}" alt="">
                            </div>
                        `).join('')}
                        ${item.photos.length > 4 ? `<div class="home-gallery-more">+${item.photos.length - 4}</div>` : ''}
                    </div>
                    ${item.description ? `<div class="post-content post-preview">${escapeHtml(item.description)}</div>` : ''}
                    <div class="post-meta">
                        <span class="post-meta-item">💬 ${item.comments.length} 条评论</span>
                        <span class="post-meta-item">📷 ${item.photos.length} 张照片</span>
                        <span class="post-meta-item">📅 创建: ${formatFullDate(item.date)}</span>
                    </div>
                </div>
            `;
        } else {
            // 渲染文章/碎碎念
            const typeName = item.contentType === 'thoughts' ? '💭 碎碎念' : '📝 文章';
            return `
                <div class="post-card" onclick="openPostDetail('${item.contentType}', ${item.id})">
                    ${currentUser && item.author === currentUser ? `
                        <div class="post-card-actions">
                            <button class="action-btn" onclick="event.stopPropagation(); editPost('${item.contentType}', ${item.id})">✏️ 编辑</button>
                            <button class="action-btn" onclick="event.stopPropagation(); deletePost('${item.contentType}', ${item.id})">🗑️ 删除</button>
                        </div>
                    ` : ''}
                    <div class="post-header">
                        <span class="post-author">${item.author === 'male' ? '♂' : '♀'}</span>
                        <span class="content-type-badge">${typeName}</span>
                    </div>
                    ${item.title ? `<div class="post-title">${escapeHtml(item.title)}</div>` : ''}
                    <div class="post-content post-preview">${escapeHtml(item.content)}</div>
                    <div class="post-meta">
                        <span class="post-meta-item">💬 ${item.comments.length} 条评论</span>
                        <span class="post-meta-item">📝 ${countWords(item.content)} 字</span>
                        <span class="post-meta-item">📅 创建: ${formatFullDate(item.date)}</span>
                        ${item.updated_at && item.updated_at !== item.date ? 
                            `<span class="post-meta-item">✏️ 修改: ${formatFullDate(item.updated_at)}</span>` : ''}
                    </div>
                </div>
            `;
        }
    }).join('');
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 加载内容列表
async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts/${currentPage}`);
        const posts = await response.json();
        
        allData[currentPage] = posts;
        totalPages[currentPage] = Math.ceil(posts.length / ITEMS_PER_PAGE);
        
        renderPosts();
        renderPagination(currentPage);
    } catch (error) {
        console.error('加载失败:', error);
    }
}

// 渲染文章列表
function renderPosts() {
    const posts = allData[currentPage];
    const listEl = document.getElementById(currentPage + 'List');
    
    if (posts.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><p>还没有内容，快来发布第一篇吧~</p></div>';
        return;
    }
    
    const start = (currentPageNum[currentPage] - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pagePosts = posts.slice(start, end);
    
    listEl.innerHTML = pagePosts.map(post => `
        <div class="post-card" onclick="openPostDetail('${currentPage}', ${post.id})">
            ${currentUser && post.author === currentUser ? `
                <div class="post-card-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); editPost('${currentPage}', ${post.id})">✏️ 编辑</button>
                    <button class="action-btn" onclick="event.stopPropagation(); deletePost('${currentPage}', ${post.id})">🗑️ 删除</button>
                </div>
            ` : ''}
            <div class="post-header">
                <span class="post-author">${post.author === 'male' ? '♂' : '♀'}</span>
            </div>
            ${post.title ? `<div class="post-title">${escapeHtml(post.title)}</div>` : ''}
            <div class="post-content post-preview">${escapeHtml(post.content)}</div>
            <div class="post-meta">
                <span class="post-meta-item">💬 ${post.comments.length} 条评论</span>
                <span class="post-meta-item">📝 ${countWords(post.content)} 字</span>
                <span class="post-meta-item">📅 创建: ${formatFullDate(post.date)}</span>
                ${post.updated_at && post.updated_at !== post.date ? 
                    `<span class="post-meta-item">✏️ 修改: ${formatFullDate(post.updated_at)}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 渲染分页
function renderPagination(pageType) {
    const paginationEl = document.getElementById(pageType + 'Pagination');
    const total = totalPages[pageType];
    const current = currentPageNum[pageType];
    
    if (total <= 1) {
        paginationEl.innerHTML = '';
        return;
    }
    
    let html = `
        <button class="pagination-btn" onclick="changePage('${pageType}', ${current - 1})" ${current === 1 ? 'disabled' : ''}>
            上一页
        </button>
    `;
    
    // 显示页码
    for (let i = 1; i <= total; i++) {
        if (
            i === 1 || 
            i === total || 
            (i >= current - 1 && i <= current + 1)
        ) {
            html += `
                <button class="pagination-btn ${i === current ? 'active' : ''}" 
                        onclick="changePage('${pageType}', ${i})">
                    ${i}
                </button>
            `;
        } else if (i === current - 2 || i === current + 2) {
            html += `<span class="pagination-info">...</span>`;
        }
    }
    
    html += `
        <button class="pagination-btn" onclick="changePage('${pageType}', ${current + 1})" ${current === total ? 'disabled' : ''}>
            下一页
        </button>
    `;
    
    paginationEl.innerHTML = html;
}

// 切换页码
function changePage(pageType, pageNum) {
    if (pageNum < 1 || pageNum > totalPages[pageType]) return;
    currentPageNum[pageType] = pageNum;
    
    if (pageType === 'gallery') {
        renderGallery();
    } else {
        renderPosts();
    }
    renderPagination(pageType);
}

// 打开内容详情
async function openPostDetail(type, id) {
    try {
        const response = await fetch(`${API_URL}/posts/${type}`);
        const posts = await response.json();
        const post = posts.find(p => p.id === id);
        
        if (!post) return;

        const detailEl = document.getElementById('postDetail');
        detailEl.innerHTML = `
            <div class="detail-header">
                <div class="detail-author-info">
                    <span class="detail-author">${post.author === 'male' ? '♂' : '♀'}</span>
                    <span class="detail-date">${formatFullDate(post.date)}</span>
                </div>
            </div>
            ${post.title ? `<h2 class="detail-title">${escapeHtml(post.title)}</h2>` : ''}
            <div class="detail-content">${escapeHtml(post.content)}</div>
            <div class="detail-stats">
                <span class="detail-stat-item">
                    <span class="stat-icon">📝</span>
                    <span class="stat-text">${countWords(post.content)} 字</span>
                </span>
                <span class="detail-stat-item">
                    <span class="stat-icon">📅</span>
                    <span class="stat-text">创建于 ${formatFullDate(post.date)}</span>
                </span>
                ${post.updated_at && post.updated_at !== post.date ? 
                    `<span class="detail-stat-item">
                        <span class="stat-icon">✏️</span>
                        <span class="stat-text">修改于 ${formatFullDate(post.updated_at)}</span>
                    </span>` : ''}
            </div>
        `;

        loadComments(post.comments);
        
        document.getElementById('detailModal').style.display = 'block';
        document.getElementById('detailModal').dataset.postType = type;
        document.getElementById('detailModal').dataset.postId = id;
    } catch (error) {
        console.error('加载详情失败:', error);
    }
}

// 打开相册详情
async function openAlbumDetail(id) {
    try {
        const response = await fetch(`${API_URL}/albums`);
        const albums = await response.json();
        const album = albums.find(a => a.id === id);
        
        if (!album) return;

        // 保存照片列表到全局变量，供viewPhoto使用
        const photoFilenames = album.photos.map(p => p.filename);
        
        const detailEl = document.getElementById('postDetail');
        detailEl.innerHTML = `
            <div class="detail-header">
                <div class="detail-author-info">
                    <span class="detail-author">${album.author === 'male' ? '♂' : '♀'}</span>
                    <span class="detail-date">${formatFullDate(album.date)}</span>
                </div>
            </div>
            <div class="detail-gallery-photos">
                ${album.photos.map((photo, index) => `
                    <div class="detail-gallery-photo" onclick="viewPhotoFromAlbum(${index})">
                        <img src="${UPLOADS_URL}/${photo.filename}" alt="">
                    </div>
                `).join('')}
            </div>
            ${album.description ? `<div class="detail-content">${escapeHtml(album.description)}</div>` : ''}
            <div class="detail-stats">
                <span class="detail-stat-item">
                    <span class="stat-icon">📷</span>
                    <span class="stat-text">${album.photos.length} 张照片</span>
                </span>
                ${album.description ? `<span class="detail-stat-item">
                    <span class="stat-icon">📝</span>
                    <span class="stat-text">${countWords(album.description)} 字</span>
                </span>` : ''}
                <span class="detail-stat-item">
                    <span class="stat-icon">📅</span>
                    <span class="stat-text">创建于 ${formatFullDate(album.date)}</span>
                </span>
            </div>
        `;
        
        // 保存当前相册的照片列表
        window.currentAlbumPhotos = photoFilenames;

        loadComments(album.comments);
        
        document.getElementById('detailModal').style.display = 'block';
        document.getElementById('detailModal').dataset.postType = 'gallery';
        document.getElementById('detailModal').dataset.postId = id;
    } catch (error) {
        console.error('加载相册详情失败:', error);
    }
}

// 加载评论
function loadComments(comments) {
    const commentsEl = document.getElementById('commentsList');
    
    if (comments.length === 0) {
        commentsEl.innerHTML = '<div class="empty-state"><p>还没有评论</p></div>';
        return;
    }

    commentsEl.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <span class="comment-author">${comment.author === 'male' ? '♂' : '♀'}</span>
                <span class="comment-date">${formatDate(comment.date)}</span>
            </div>
            <div class="comment-content">${escapeHtml(comment.content)}</div>
        </div>
    `).join('');
}

// 提交评论
async function handleSubmitComment() {
    const content = document.getElementById('commentInput').value.trim();
    
    if (!content) {
        alert('请输入评论内容');
        return;
    }

    const modal = document.getElementById('detailModal');
    const type = modal.dataset.postType;
    const id = parseInt(modal.dataset.postId);

    try {
        const response = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                post_id: id,
                post_type: type,
                author: currentUser,
                content: content
            })
        });

        if (response.ok) {
            showToast('✅ 评论成功！');
            document.getElementById('commentInput').value = '';
            await openPostDetail(type, id);
            await loadPosts();
        } else {
            throw new Error('评论失败');
        }
    } catch (error) {
        console.error('评论失败:', error);
        alert('评论失败: ' + error.message);
    }
}

// 相册相关
function openAlbumModal() {
    selectedPhotos = [];
    document.getElementById('albumDescription').value = '';
    document.getElementById('previewContainer').innerHTML = '';
    document.getElementById('albumModal').style.display = 'block';
}

function handlePhotoSelect(e) {
    const files = Array.from(e.target.files);
    handlePhotoFiles(files);
}

function handlePhotoFiles(files) {
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            selectedPhotos.push(file);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.createElement('div');
                preview.className = 'preview-item';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="预览">
                    <button class="preview-remove" onclick="removePhoto(${selectedPhotos.length - 1})">×</button>
                `;
                document.getElementById('previewContainer').appendChild(preview);
            };
            reader.readAsDataURL(file);
        }
    });
}

function removePhoto(index) {
    selectedPhotos.splice(index, 1);
    const container = document.getElementById('previewContainer');
    container.children[index].remove();
}

async function handleSubmitAlbum() {
    if (selectedPhotos.length === 0) {
        alert('请选择照片');
        return;
    }

    const description = document.getElementById('albumDescription').value.trim();
    const formData = new FormData();
    
    formData.append('author', currentUser);
    formData.append('description', description);
    selectedPhotos.forEach(photo => {
        formData.append('photos', photo);
    });

    try {
        const response = await fetch(`${API_URL}/albums`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            showToast('✅ 照片上传成功！');
            document.getElementById('albumModal').style.display = 'none';
            await loadGallery();
        } else {
            throw new Error('上传失败');
        }
    } catch (error) {
        console.error('上传失败:', error);
        alert('上传失败: ' + error.message);
    }
}

async function loadGallery() {
    try {
        const response = await fetch(`${API_URL}/albums`);
        const albums = await response.json();
        
        allData.gallery = albums;
        totalPages.gallery = Math.ceil(albums.length / ITEMS_PER_PAGE);
        
        renderGallery();
        renderPagination('gallery');
    } catch (error) {
        console.error('加载相册失败:', error);
    }
}

// 渲染相册
function renderGallery() {
    const albums = allData.gallery;
    const listEl = document.getElementById('galleryList');
    
    if (albums.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><p>还没有照片，快来上传第一张吧~</p></div>';
        return;
    }
    
    const start = (currentPageNum.gallery - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageAlbums = albums.slice(start, end);
    
    // 按日期分组
    const grouped = {};
    pageAlbums.forEach(album => {
        const date = new Date(album.date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(album);
    });

    listEl.innerHTML = Object.entries(grouped).map(([date, items]) => `
        <div class="gallery-date-group">
            <div class="gallery-date-header">${date}</div>
            ${items.map(album => {
                // 为每个相册创建照片文件名数组
                const photoFilenames = album.photos.map(p => p.filename);
                const photoListStr = JSON.stringify(photoFilenames).replace(/"/g, '&quot;');
                
                return `
                <div class="gallery-item" onclick="openAlbumDetail(${album.id})">
                    ${currentUser && album.author === currentUser ? `
                        <div class="gallery-item-actions">
                            <button class="action-btn" onclick="event.stopPropagation(); editAlbum(${album.id})">✏️ 编辑</button>
                            <button class="action-btn" onclick="event.stopPropagation(); deleteAlbum(${album.id})">🗑️ 删除</button>
                        </div>
                    ` : ''}
                    <div class="gallery-item-header">
                        <span class="post-author">${album.author === 'male' ? '♂' : '♀'}</span>
                    </div>
                    <div class="gallery-photos">
                        ${album.photos.map((photo, index) => `
                            <div class="gallery-photo" onclick="event.stopPropagation(); viewPhotoFromList('${photo.filename}', ${index}, ${album.id})">
                                <img src="${UPLOADS_URL}/${photo.filename}" alt="">
                            </div>
                        `).join('')}
                    </div>
                    ${album.description ? `<div class="gallery-description">${escapeHtml(album.description)}</div>` : ''}
                    <div class="post-meta">
                        <span class="post-meta-item">💬 ${album.comments.length} 条评论</span>
                        <span class="post-meta-item">📷 ${album.photos.length} 张照片</span>
                        ${album.description ? `<span class="post-meta-item">📝 ${countWords(album.description)} 字</span>` : ''}
                        <span class="post-meta-item">📅 创建: ${formatFullDate(album.date)}</span>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `).join('');
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function viewPhoto(filename, photoList = null) {
    const viewer = document.getElementById('photoViewer');
    const img = document.getElementById('viewerImage');
    
    // 如果提供了照片列表，保存它
    if (photoList && Array.isArray(photoList)) {
        currentPhotoList = photoList;
        currentPhotoIndex = photoList.findIndex(p => p === filename);
    } else {
        // 单张照片模式
        currentPhotoList = [filename];
        currentPhotoIndex = 0;
    }
    
    img.src = `${UPLOADS_URL}/${filename}`;
    viewer.style.display = 'block';
    updatePhotoNavigation();
}

// 更新照片导航按钮状态
function updatePhotoNavigation() {
    const prevBtn = document.getElementById('photoPrev');
    const nextBtn = document.getElementById('photoNext');
    const counter = document.getElementById('photoCounter');
    
    // 更新按钮状态
    prevBtn.disabled = currentPhotoIndex === 0;
    nextBtn.disabled = currentPhotoIndex === currentPhotoList.length - 1;
    
    // 更新计数器
    if (currentPhotoList.length > 1) {
        counter.textContent = `${currentPhotoIndex + 1} / ${currentPhotoList.length}`;
        counter.style.display = 'block';
    } else {
        counter.style.display = 'none';
    }
    
    // 显示/隐藏导航按钮
    if (currentPhotoList.length > 1) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
    } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }
}

// 切换到上一张照片
function prevPhoto() {
    if (currentPhotoIndex > 0) {
        currentPhotoIndex--;
        const img = document.getElementById('viewerImage');
        img.src = `${UPLOADS_URL}/${currentPhotoList[currentPhotoIndex]}`;
        updatePhotoNavigation();
    }
}

// 切换到下一张照片
function nextPhoto() {
    if (currentPhotoIndex < currentPhotoList.length - 1) {
        currentPhotoIndex++;
        const img = document.getElementById('viewerImage');
        img.src = `${UPLOADS_URL}/${currentPhotoList[currentPhotoIndex]}`;
        updatePhotoNavigation();
    }
}

// 从相册中查看照片
function viewPhotoFromAlbum(index) {
    if (window.currentAlbumPhotos && window.currentAlbumPhotos.length > 0) {
        currentPhotoList = window.currentAlbumPhotos;
        currentPhotoIndex = index;
        const img = document.getElementById('viewerImage');
        img.src = `${UPLOADS_URL}/${currentPhotoList[currentPhotoIndex]}`;
        document.getElementById('photoViewer').style.display = 'block';
        updatePhotoNavigation();
    }
}

// 从相册列表中查看照片
function viewPhotoFromList(filename, index, albumId) {
    // 从allData.gallery中找到对应的相册
    const album = allData.gallery.find(a => a.id === albumId);
    if (album && album.photos) {
        currentPhotoList = album.photos.map(p => p.filename);
        currentPhotoIndex = index;
        const img = document.getElementById('viewerImage');
        img.src = `${UPLOADS_URL}/${currentPhotoList[currentPhotoIndex]}`;
        document.getElementById('photoViewer').style.display = 'block';
        updatePhotoNavigation();
    }
}

// 格式化日期（北京时间）
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'Asia/Shanghai'
    });
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 统计字数
function countWords(text) {
    if (!text) return 0;
    // 移除空白字符后计算长度
    return text.replace(/\s/g, '').length;
}

// 格式化完整日期（北京时间）
function formatFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Shanghai'
    });
}


// 编辑文章
async function editPost(type, id) {
    const post = allData[type].find(p => p.id === id);
    if (!post) return;
    
    currentPostType = type;
    currentPostId = id;
    
    const modal = document.getElementById('editorModal');
    const title = document.getElementById('editorTitle');
    const postTitle = document.getElementById('postTitle');
    const postContent = document.getElementById('postContent');

    title.textContent = '编辑' + (type === 'thoughts' ? '碎碎念' : '文章');
    
    if (type === 'thoughts') {
        postTitle.style.display = 'none';
        postTitle.value = '';
    } else {
        postTitle.style.display = 'block';
        postTitle.value = post.title || '';
    }
    
    postContent.value = post.content;
    modal.style.display = 'block';
}

// 删除文章/碎碎念
async function deletePost(type, id) {
    if (!confirm('确定要删除这条内容吗？删除后无法恢复。')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/posts/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('✅ 删除成功！');
            await loadPosts();
        } else {
            throw new Error('删除失败');
        }
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败: ' + error.message);
    }
}

// 编辑相册
async function editAlbum(id) {
    try {
        const response = await fetch(`${API_URL}/albums`);
        const albums = await response.json();
        const album = albums.find(a => a.id === id);
        
        if (!album) return;
        
        const newDescription = prompt('修改相册描述：', album.description || '');
        
        if (newDescription === null) return; // 用户取消
        
        const updateResponse = await fetch(`${API_URL}/albums/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: newDescription })
        });
        
        if (updateResponse.ok) {
            showToast('✅ 修改成功！');
            if (currentPage === 'home') {
                await loadHomePage();
            } else {
                await loadGallery();
            }
        } else {
            throw new Error('修改失败');
        }
    } catch (error) {
        console.error('修改失败:', error);
        alert('修改失败: ' + error.message);
    }
}

// 删除相册
async function deleteAlbum(id) {
    if (!confirm('确定要删除这个相册吗？删除后无法恢复。')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/albums/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('✅ 删除成功！');
            await loadGallery();
        } else {
            throw new Error('删除失败');
        }
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败: ' + error.message);
    }
}

// 提交内容
async function handleSubmitPost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();

    if (!content) {
        alert('请输入内容');
        return;
    }

    if (currentPostType === 'articles' && !title) {
        alert('请输入标题');
        return;
    }

    try {
        if (currentPostId) {
            // 更新现有文章
            const response = await fetch(`${API_URL}/posts/${currentPostId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: currentPostType === 'articles' ? title : '',
                    content: content
                })
            });

            if (response.ok) {
                showToast('✅ 修改成功！');
                currentPostId = null;
                document.getElementById('editorModal').style.display = 'none';
                await loadPosts();
            } else {
                throw new Error('更新失败');
            }
        } else {
            // 创建新文章
            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: currentPostType,
                    author: currentUser,
                    title: currentPostType === 'articles' ? title : '',
                    content: content
                })
            });

            if (response.ok) {
                showToast('✅ 发布成功！');
                document.getElementById('editorModal').style.display = 'none';
                await loadPosts();
            } else {
                throw new Error('发布失败');
            }
        }
    } catch (error) {
        console.error('操作失败:', error);
        alert('操作失败: ' + error.message);
    }
}

// 搜索功能
function openSearchModal() {
    document.getElementById('searchModal').style.display = 'block';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchInput').focus();
}

async function handleSearch() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultsEl = document.getElementById('searchResults');
    
    if (!keyword) {
        resultsEl.innerHTML = '';
        return;
    }
    
    const filterThoughts = document.getElementById('filterThoughts').checked;
    const filterArticles = document.getElementById('filterArticles').checked;
    const filterGallery = document.getElementById('filterGallery').checked;
    
    let results = [];
    
    // 搜索碎碎念
    if (filterThoughts && allData.thoughts) {
        allData.thoughts.forEach(post => {
            if (post.content.toLowerCase().includes(keyword)) {
                results.push({ ...post, type: 'thoughts', typeName: '碎碎念' });
            }
        });
    }
    
    // 搜索文章
    if (filterArticles && allData.articles) {
        allData.articles.forEach(post => {
            if (post.title?.toLowerCase().includes(keyword) || 
                post.content.toLowerCase().includes(keyword)) {
                results.push({ ...post, type: 'articles', typeName: '文章' });
            }
        });
    }
    
    // 搜索相册
    if (filterGallery && allData.gallery) {
        allData.gallery.forEach(album => {
            if (album.description?.toLowerCase().includes(keyword)) {
                results.push({ ...album, type: 'gallery', typeName: '相册' });
            }
        });
    }
    
    if (results.length === 0) {
        resultsEl.innerHTML = '<div class="empty-state"><p>没有找到相关内容</p></div>';
        return;
    }
    
    resultsEl.innerHTML = results.map(item => `
        <div class="search-result-item" onclick="openSearchResult('${item.type}', ${item.id})">
            <div class="search-result-header">
                <span class="post-author">${item.author === 'male' ? '♂' : '♀'}</span>
                <span class="search-result-type">${item.typeName}</span>
            </div>
            ${item.title ? `<div class="search-result-title">${highlightText(escapeHtml(item.title), keyword)}</div>` : ''}
            <div class="search-result-content">
                ${highlightText(escapeHtml(item.content || item.description || ''), keyword)}
            </div>
            <div class="post-date">${formatDate(item.date)}</div>
        </div>
    `).join('');
}

function highlightText(text, keyword) {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function openSearchResult(type, id) {
    document.getElementById('searchModal').style.display = 'none';
    
    if (type === 'gallery') {
        switchPage('gallery');
    } else {
        if (currentPage !== type) {
            switchPage(type);
        }
        setTimeout(() => {
            openPostDetail(type, id);
        }, 100);
    }
}

// 计算天数
function calculateDays() {
    const startDate = new Date('2025-12-01T00:00:00+08:00'); // 北京时间2025年12月1日
    const now = new Date();
    
    // 计算天数差（向下取整）
    const diffTime = now - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 因为第一天算作第1天
    
    return diffDays;
}

// 更新页面头部的天数计时器
function updateHeaderDayCounter() {
    const counterEl = document.getElementById('headerDayCounter');
    if (counterEl) {
        const days = calculateDays();
        animateCounter(counterEl, days);
    }
}

// 数字滚动动画
function animateCounter(element, targetValue) {
    const currentValue = parseInt(element.textContent) || 0;
    
    // 如果值没有变化，直接设置
    if (currentValue === targetValue) {
        element.textContent = targetValue;
        return;
    }
    
    const duration = 1000; // 动画持续时间
    const steps = 30; // 动画步数
    const increment = (targetValue - currentValue) / steps;
    let current = currentValue;
    let step = 0;
    
    const timer = setInterval(() => {
        step++;
        current += increment;
        
        if (step >= steps) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
}

// 日历功能
async function openCalendarModal() {
    document.getElementById('calendarModal').style.display = 'block';
    updateDayCounter();
    await loadCalendarData();
    renderCalendar();
}

// 更新日历弹窗中的天数计时器
function updateDayCounter() {
    const counterEl = document.getElementById('dayCounter');
    if (counterEl) {
        const days = calculateDays();
        animateCounter(counterEl, days);
    }
}

async function loadCalendarData() {
    try {
        // 加载所有数据
        const [thoughtsRes, articlesRes, albumsRes] = await Promise.all([
            fetch(`${API_URL}/posts/thoughts`),
            fetch(`${API_URL}/posts/articles`),
            fetch(`${API_URL}/albums`)
        ]);
        
        const thoughts = await thoughtsRes.json();
        const articles = await articlesRes.json();
        const albums = await albumsRes.json();
        
        calendarData = [
            ...thoughts.map(p => ({ ...p, type: 'thoughts' })),
            ...articles.map(p => ({ ...p, type: 'articles' })),
            ...albums.map(a => ({ ...a, type: 'gallery' }))
        ];
    } catch (error) {
        console.error('加载日历数据失败:', error);
    }
}

function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    // 更新月份显示
    document.getElementById('currentMonth').textContent = 
        `${year}年${month + 1}月`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const prevDaysInMonth = prevLastDay.getDate();
    
    let html = '';
    
    // 星期标题
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    weekDays.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // 上个月的日期
    for (let i = firstDayWeek - 1; i >= 0; i--) {
        const day = prevDaysInMonth - i;
        html += `<div class="calendar-day other-month">
            <span class="calendar-day-number">${day}</span>
        </div>`;
    }
    
    // 当前月的日期
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        // 使用北京时间
        const dateStr = date.toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            timeZone: 'Asia/Shanghai'
        }).replace(/\//g, '-');
        
        // 查找这一天的内容
        const dayContent = calendarData.filter(item => {
            const itemDate = new Date(item.date);
            const itemDateStr = itemDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Asia/Shanghai'
            }).replace(/\//g, '-');
            return itemDateStr === dateStr;
        });
        
        const isToday = today.getFullYear() === year && 
                       today.getMonth() === month && 
                       today.getDate() === day;
        
        const hasMale = dayContent.some(item => item.author === 'male');
        const hasFemale = dayContent.some(item => item.author === 'female');
        
        let markers = '';
        if (hasMale) markers += '<span class="calendar-marker male"></span>';
        if (hasFemale) markers += '<span class="calendar-marker female"></span>';
        
        let detail = '';
        if (dayContent.length > 0) {
            detail = `<div class="calendar-day-detail">
                ${dayContent.length} 条内容
            </div>`;
        }
        
        html += `<div class="calendar-day ${isToday ? 'today' : ''} ${dayContent.length > 0 ? 'has-content' : ''}"
                     onclick="viewCalendarDay('${dateStr}', ${year}, ${month}, ${day})">
            <span class="calendar-day-number">${day}</span>
            ${markers ? `<div class="calendar-day-markers">${markers}</div>` : ''}
            ${detail}
        </div>`;
    }
    
    // 下个月的日期
    const remainingDays = 42 - (firstDayWeek + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        html += `<div class="calendar-day other-month">
            <span class="calendar-day-number">${day}</span>
        </div>`;
    }
    
    document.getElementById('calendarGrid').innerHTML = html;
}

function changeMonth(delta) {
    calendarDate.setMonth(calendarDate.getMonth() + delta);
    renderCalendar();
}

function viewCalendarDay(dateStr, year, month, day) {
    const dayContent = calendarData.filter(item => {
        const itemDate = new Date(item.date);
        const itemDateStr = itemDate.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Asia/Shanghai'
        }).replace(/\//g, '-');
        return itemDateStr === dateStr;
    });
    
    if (dayContent.length === 0) {
        showToast('该日期没有内容', 'warning');
        return;
    }
    
    // 关闭日历，打开搜索结果
    document.getElementById('calendarModal').style.display = 'none';
    
    const resultsEl = document.getElementById('searchResults');
    const modal = document.getElementById('searchModal');
    
    const dateTitle = `${year}年${month + 1}月${day}日`;
    
    resultsEl.innerHTML = `
        <div style="text-align: center; padding: 15px; background: #fff4d6; border-radius: 6px; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #d4a017;">${dateTitle} 的内容 (${dayContent.length}条)</h3>
        </div>
    ` + dayContent.map(item => {
        const typeName = item.type === 'thoughts' ? '碎碎念' : 
                        item.type === 'articles' ? '文章' : '相册';
        return `
            <div class="search-result-item" onclick="openSearchResult('${item.type}', ${item.id})">
                <div class="search-result-header">
                    <span class="post-author">${item.author === 'male' ? '♂' : '♀'}</span>
                    <span class="search-result-type">${typeName}</span>
                </div>
                ${item.title ? `<div class="search-result-title">${escapeHtml(item.title)}</div>` : ''}
                <div class="search-result-content">
                    ${escapeHtml(item.content || item.description || '')}
                </div>
                <div class="post-date">${formatFullDate(item.date)}</div>
            </div>
        `;
    }).join('');
    
    modal.style.display = 'block';
    document.getElementById('searchInput').value = '';
}


// 检查新通知
async function checkNotifications() {
    if (!currentUser || !lastCheckTime) {
        return;
    }
    
    try {
        const [thoughtsRes, articlesRes, albumsRes] = await Promise.all([
            fetch(`${API_URL}/posts/thoughts`),
            fetch(`${API_URL}/posts/articles`),
            fetch(`${API_URL}/albums`)
        ]);
        
        const thoughts = await thoughtsRes.json();
        const articles = await articlesRes.json();
        const albums = await albumsRes.json();
        
        // 获取对方账号的新内容
        const otherUser = currentUser === 'male' ? 'female' : 'male';
        const lastCheckDate = new Date(lastCheckTime);
        
        const newContent = [
            ...thoughts.filter(item => item.author === otherUser && new Date(item.date) > lastCheckDate),
            ...articles.filter(item => item.author === otherUser && new Date(item.date) > lastCheckDate),
            ...albums.filter(item => item.author === otherUser && new Date(item.date) > lastCheckDate)
        ];
        
        notificationCount = newContent.length;
        updateNotificationBadge();
    } catch (error) {
        console.error('检查通知失败:', error);
    }
}

// 更新通知角标
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    
    if (notificationCount > 0) {
        badge.textContent = notificationCount > 99 ? '99+' : notificationCount;
        badge.classList.add('show');
    } else {
        badge.classList.remove('show');
    }
}

// 打开通知弹窗
async function openNotificationModal() {
    document.getElementById('notificationModal').style.display = 'block';
    await loadNotifications();
    
    // 清空计数并更新最后检查时间
    notificationCount = 0;
    lastCheckTime = new Date().toISOString();
    
    // 保存到 localStorage
    if (currentUser) {
        const storageKey = `lastCheckTime_${currentUser}`;
        localStorage.setItem(storageKey, lastCheckTime);
    }
    
    updateNotificationBadge();
}

// 加载通知列表
async function loadNotifications() {
    const listEl = document.getElementById('notificationList');
    
    if (!currentUser) {
        listEl.innerHTML = '<div class="notification-empty"><p>请先登录</p></div>';
        return;
    }
    
    try {
        const [thoughtsRes, articlesRes, albumsRes] = await Promise.all([
            fetch(`${API_URL}/posts/thoughts`),
            fetch(`${API_URL}/posts/articles`),
            fetch(`${API_URL}/albums`)
        ]);
        
        const thoughts = await thoughtsRes.json();
        const articles = await articlesRes.json();
        const albums = await albumsRes.json();
        
        // 获取对方账号的所有内容
        const otherUser = currentUser === 'male' ? 'female' : 'male';
        const allContent = [
            ...thoughts.filter(item => item.author === otherUser).map(item => ({ ...item, contentType: 'thoughts' })),
            ...articles.filter(item => item.author === otherUser).map(item => ({ ...item, contentType: 'articles' })),
            ...albums.filter(item => item.author === otherUser).map(item => ({ ...item, contentType: 'gallery' }))
        ];
        
        // 按时间倒序排序，只取最近10条
        allContent.sort((a, b) => new Date(b.date) - new Date(a.date));
        const recentContent = allContent.slice(0, 10);
        
        if (recentContent.length === 0) {
            listEl.innerHTML = '<div class="notification-empty"><p>暂无通知</p></div>';
            return;
        }
        
        listEl.innerHTML = recentContent.map(item => {
            const typeIcon = item.contentType === 'thoughts' ? '💭' : 
                           item.contentType === 'articles' ? '📝' : '📷';
            const typeName = item.contentType === 'thoughts' ? '碎碎念' : 
                           item.contentType === 'articles' ? '文章' : '相册';
            
            let content = '';
            if (item.contentType === 'gallery') {
                content = item.description || '发布了新相册';
            } else {
                content = item.title || item.content;
            }
            
            const clickHandler = item.contentType === 'gallery' ? 
                `openAlbumDetail(${item.id})` : 
                `openPostDetail('${item.contentType}', ${item.id})`;
            
            return `
                <div class="notification-item" onclick="closeNotificationAndOpen('${clickHandler}')">
                    <div class="notification-header">
                        <div class="notification-type">
                            <span class="notification-author">${item.author === 'male' ? '♂' : '♀'}</span>
                            <span>${typeIcon} ${typeName}</span>
                        </div>
                        <span class="notification-time">${formatDate(item.date)}</span>
                    </div>
                    <div class="notification-content">${escapeHtml(content)}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('加载通知失败:', error);
        listEl.innerHTML = '<div class="notification-empty"><p>加载失败</p></div>';
    }
}

// 关闭通知并打开内容
function closeNotificationAndOpen(handler) {
    document.getElementById('notificationModal').style.display = 'none';
    eval(handler);
}

// Toast 提示
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    
    if (type === 'error') {
        toast.classList.add('error');
    } else if (type === 'warning') {
        toast.classList.add('warning');
    }
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
