/**
 * 调试版服务器
 * 包含详细的日志输出，用于排查部署问题
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 日志函数
function log(type, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

log('INFO', '启动调试模式服务器...');
log('INFO', `Node.js版本: ${process.version}`);
log('INFO', `工作目录: ${process.cwd()}`);
log('INFO', `端口: ${PORT}`);

// 中间件
app.use(cors());
log('INFO', 'CORS已启用');

app.use(express.json({ limit: '50mb' }));
log('INFO', 'JSON解析器已启用，限制: 50mb');

app.use(express.static('public'));
log('INFO', '静态文件服务已启用: public/');

app.use('/uploads', express.static('uploads'));
log('INFO', '上传文件服务已启用: uploads/');

// 请求日志中间件
app.use((req, res, next) => {
    log('REQUEST', `${req.method} ${req.url}`, {
        headers: req.headers,
        body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
    });
    next();
});

// 确保上传目录存在
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
    log('INFO', 'uploads目录已创建');
} else {
    log('INFO', 'uploads目录已存在');
}

// 检查uploads目录权限
try {
    const testFile = 'uploads/.test-' + Date.now();
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    log('INFO', 'uploads目录可写');
} catch (e) {
    log('ERROR', 'uploads目录不可写', { error: e.message });
}

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        log('INFO', '文件上传目标目录: uploads/');
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + path.extname(file.originalname);
        log('INFO', `生成文件名: ${filename}`);
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
log('INFO', '文件上传配置完成，最大文件大小: 10MB');

// 初始化数据库
log('INFO', '初始化数据库连接...');
const db = new sqlite3.Database('./blog.db', (err) => {
    if (err) {
        log('ERROR', '数据库连接失败', { error: err.message });
    } else {
        log('INFO', '数据库连接成功');
        
        // 检查数据库文件权限
        try {
            const stats = fs.statSync('./blog.db');
            log('INFO', `数据库文件大小: ${stats.size} bytes`);
            if (process.platform !== 'win32') {
                const mode = (stats.mode & parseInt('777', 8)).toString(8);
                log('INFO', `数据库文件权限: ${mode}`);
            }
        } catch (e) {
            log('ERROR', '无法读取数据库文件信息', { error: e.message });
        }
        
        initDatabase();
    }
});

// 创建数据表
function initDatabase() {
    log('INFO', '初始化数据库表...');
    
    db.serialize(() => {
        // 文章表
        db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            author TEXT NOT NULL,
            title TEXT,
            content TEXT NOT NULL,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                log('ERROR', '创建posts表失败', { error: err.message });
            } else {
                log('INFO', 'posts表已创建/已存在');
            }
        });

        // 评论表
        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            post_type TEXT NOT NULL,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            date DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                log('ERROR', '创建comments表失败', { error: err.message });
            } else {
                log('INFO', 'comments表已创建/已存在');
            }
        });

        // 相册表
        db.run(`CREATE TABLE IF NOT EXISTS albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            description TEXT,
            date DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                log('ERROR', '创建albums表失败', { error: err.message });
            } else {
                log('INFO', 'albums表已创建/已存在');
            }
        });

        // 相册照片表
        db.run(`CREATE TABLE IF NOT EXISTS album_photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            album_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) {
                log('ERROR', '创建album_photos表失败', { error: err.message });
            } else {
                log('INFO', 'album_photos表已创建/已存在');
            }
        });
    });
}

// API路由 - 获取文章列表
app.get('/api/posts/:type', (req, res) => {
    const type = req.params.type;
    log('INFO', `获取文章列表: ${type}`);
    
    db.all(
        'SELECT * FROM posts WHERE type = ? ORDER BY date DESC',
        [type],
        (err, posts) => {
            if (err) {
                log('ERROR', '查询文章失败', { error: err.message, type });
                return res.status(500).json({ error: err.message });
            }

            log('INFO', `查询到 ${posts.length} 篇文章`);

            // 获取每篇文章的评论
            const postsWithComments = posts.map(post => {
                return new Promise((resolve) => {
                    db.all(
                        'SELECT * FROM comments WHERE post_id = ? AND post_type = ? ORDER BY date ASC',
                        [post.id, type],
                        (err, comments) => {
                            if (err) {
                                log('ERROR', '查询评论失败', { error: err.message, postId: post.id });
                                resolve({ ...post, comments: [] });
                            } else {
                                resolve({ ...post, comments: comments || [] });
                            }
                        }
                    );
                });
            });

            Promise.all(postsWithComments).then(results => {
                log('INFO', `返回 ${results.length} 篇文章（含评论）`);
                res.json(results);
            });
        }
    );
});

// API路由 - 创建文章
app.post('/api/posts', (req, res) => {
    const { type, author, title, content } = req.body;
    log('INFO', '创建新文章', { type, author, titleLength: title?.length, contentLength: content?.length });

    if (!type || !author || !content) {
        log('ERROR', '缺少必需字段', { type, author, hasContent: !!content });
        return res.status(400).json({ error: '缺少必需字段' });
    }

    db.run(
        'INSERT INTO posts (type, author, title, content) VALUES (?, ?, ?, ?)',
        [type, author, title || '', content],
        function(err) {
            if (err) {
                log('ERROR', '插入文章失败', { error: err.message });
                return res.status(500).json({ error: err.message });
            }
            log('INFO', `文章创建成功，ID: ${this.lastID}`);
            res.json({ id: this.lastID, message: '发布成功' });
        }
    );
});

// API路由 - 更新文章
app.put('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    log('INFO', `更新文章 ID: ${id}`);

    db.run(
        'UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title || '', content, id],
        function(err) {
            if (err) {
                log('ERROR', '更新文章失败', { error: err.message, id });
                return res.status(500).json({ error: err.message });
            }
            log('INFO', `文章更新成功，ID: ${id}`);
            res.json({ message: '更新成功' });
        }
    );
});

// API路由 - 删除文章
app.delete('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    log('INFO', `删除文章 ID: ${id}`);

    // 先删除评论
    db.run('DELETE FROM comments WHERE post_id = ?', [id], (err) => {
        if (err) {
            log('ERROR', '删除评论失败', { error: err.message, id });
        }

        // 再删除文章
        db.run('DELETE FROM posts WHERE id = ?', [id], function(err) {
            if (err) {
                log('ERROR', '删除文章失败', { error: err.message, id });
                return res.status(500).json({ error: err.message });
            }
            log('INFO', `文章删除成功，ID: ${id}`);
            res.json({ message: '删除成功' });
        });
    });
});

// API路由 - 创建评论
app.post('/api/comments', (req, res) => {
    const { post_id, post_type, author, content } = req.body;
    log('INFO', '创建新评论', { post_id, post_type, author });

    db.run(
        'INSERT INTO comments (post_id, post_type, author, content) VALUES (?, ?, ?, ?)',
        [post_id, post_type, author, content],
        function(err) {
            if (err) {
                log('ERROR', '插入评论失败', { error: err.message });
                return res.status(500).json({ error: err.message });
            }
            log('INFO', `评论创建成功，ID: ${this.lastID}`);
            res.json({ id: this.lastID, message: '评论成功' });
        }
    );
});

// API路由 - 获取相册列表
app.get('/api/albums', (req, res) => {
    log('INFO', '获取相册列表');
    
    db.all('SELECT * FROM albums ORDER BY date DESC', [], (err, albums) => {
        if (err) {
            log('ERROR', '查询相册失败', { error: err.message });
            return res.status(500).json({ error: err.message });
        }

        log('INFO', `查询到 ${albums.length} 个相册`);

        const albumsWithPhotos = albums.map(album => {
            return new Promise((resolve) => {
                // 获取照片
                db.all(
                    'SELECT * FROM album_photos WHERE album_id = ?',
                    [album.id],
                    (err, photos) => {
                        if (err) {
                            log('ERROR', '查询相册照片失败', { error: err.message, albumId: album.id });
                            photos = [];
                        }

                        // 获取评论
                        db.all(
                            'SELECT * FROM comments WHERE post_id = ? AND post_type = ? ORDER BY date ASC',
                            [album.id, 'gallery'],
                            (err, comments) => {
                                if (err) {
                                    log('ERROR', '查询相册评论失败', { error: err.message, albumId: album.id });
                                    comments = [];
                                }
                                resolve({ ...album, photos: photos || [], comments: comments || [] });
                            }
                        );
                    }
                );
            });
        });

        Promise.all(albumsWithPhotos).then(results => {
            log('INFO', `返回 ${results.length} 个相册（含照片和评论）`);
            res.json(results);
        });
    });
});

// API路由 - 创建相册
app.post('/api/albums', upload.array('photos', 20), (req, res) => {
    const { author, description } = req.body;
    const files = req.files;
    
    log('INFO', '创建新相册', { author, photoCount: files?.length });

    if (!files || files.length === 0) {
        log('ERROR', '没有上传照片');
        return res.status(400).json({ error: '请至少上传一张照片' });
    }

    db.run(
        'INSERT INTO albums (author, description) VALUES (?, ?)',
        [author, description || ''],
        function(err) {
            if (err) {
                log('ERROR', '插入相册失败', { error: err.message });
                return res.status(500).json({ error: err.message });
            }

            const albumId = this.lastID;
            log('INFO', `相册创建成功，ID: ${albumId}`);

            // 插入照片记录
            const stmt = db.prepare('INSERT INTO album_photos (album_id, filename) VALUES (?, ?)');
            files.forEach(file => {
                stmt.run(albumId, file.filename, (err) => {
                    if (err) {
                        log('ERROR', '插入照片记录失败', { error: err.message, filename: file.filename });
                    }
                });
            });
            stmt.finalize();

            log('INFO', `${files.length} 张照片记录已插入`);
            res.json({ id: albumId, message: '上传成功' });
        }
    );
});

// API路由 - 删除相册
app.delete('/api/albums/:id', (req, res) => {
    const { id } = req.params;
    log('INFO', `删除相册 ID: ${id}`);

    // 先获取照片文件名
    db.all('SELECT filename FROM album_photos WHERE album_id = ?', [id], (err, photos) => {
        if (err) {
            log('ERROR', '查询相册照片失败', { error: err.message, id });
        }

        // 删除物理文件
        if (photos) {
            photos.forEach(photo => {
                const filePath = path.join('uploads', photo.filename);
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        log('INFO', `删除文件: ${filePath}`);
                    }
                } catch (e) {
                    log('ERROR', `删除文件失败: ${filePath}`, { error: e.message });
                }
            });
        }

        // 删除照片记录
        db.run('DELETE FROM album_photos WHERE album_id = ?', [id], (err) => {
            if (err) {
                log('ERROR', '删除照片记录失败', { error: err.message, id });
            }

            // 删除评论
            db.run('DELETE FROM comments WHERE post_id = ? AND post_type = ?', [id, 'gallery'], (err) => {
                if (err) {
                    log('ERROR', '删除相册评论失败', { error: err.message, id });
                }

                // 删除相册
                db.run('DELETE FROM albums WHERE id = ?', [id], function(err) {
                    if (err) {
                        log('ERROR', '删除相册失败', { error: err.message, id });
                        return res.status(500).json({ error: err.message });
                    }
                    log('INFO', `相册删除成功，ID: ${id}`);
                    res.json({ message: '删除成功' });
                });
            });
        });
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    log('ERROR', '服务器错误', { error: err.message, stack: err.stack });
    res.status(500).json({ error: '服务器内部错误', message: err.message });
});

// 启动服务器
app.listen(PORT, () => {
    log('INFO', `服务器运行在 http://localhost:${PORT}`);
    log('INFO', '调试模式已启用，所有请求和错误将被记录');
});

// 优雅关闭
process.on('SIGTERM', () => {
    log('INFO', '收到SIGTERM信号，正在关闭服务器...');
    db.close((err) => {
        if (err) {
            log('ERROR', '关闭数据库连接失败', { error: err.message });
        } else {
            log('INFO', '数据库连接已关闭');
        }
        process.exit(0);
    });
});
