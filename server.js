const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 确保上传目录存在
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// 初始化数据库
const db = new sqlite3.Database('./blog.db', (err) => {
    if (err) {
        console.error('数据库连接失败:', err);
    } else {
        console.log('数据库连接成功');
        initDatabase();
    }
});

// 创建数据表
function initDatabase() {
    db.serialize(() => {
        // 文章表
        db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            author TEXT NOT NULL,
            title TEXT,
            content TEXT NOT NULL,
            date TEXT NOT NULL,
            updated_at TEXT
        )`);

        // 评论表
        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            post_type TEXT NOT NULL,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY (post_id) REFERENCES posts(id)
        )`);

        // 相册表
        db.run(`CREATE TABLE IF NOT EXISTS albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL
        )`);

        // 照片表
        db.run(`CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            album_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            FOREIGN KEY (album_id) REFERENCES albums(id)
        )`);
    });
}

// API 路由

// 获取所有文章/碎碎念
app.get('/api/posts/:type', (req, res) => {
    const type = req.params.type;
    db.all(
        `SELECT * FROM posts WHERE type = ? ORDER BY date DESC`,
        [type],
        (err, posts) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // 获取每篇文章的评论数
            const postsWithComments = posts.map(post => {
                return new Promise((resolve) => {
                    db.all(
                        `SELECT * FROM comments WHERE post_id = ? AND post_type = ? ORDER BY date ASC`,
                        [post.id, type],
                        (err, comments) => {
                            resolve({ ...post, comments: comments || [] });
                        }
                    );
                });
            });
            
            Promise.all(postsWithComments).then(results => {
                res.json(results);
            });
        }
    );
});

// 创建文章/碎碎念
app.post('/api/posts', (req, res) => {
    const { type, author, title, content } = req.body;
    const date = new Date().toISOString();
    
    db.run(
        `INSERT INTO posts (type, author, title, content, date, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [type, author, title || '', content, date, date],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, type, author, title, content, date, updated_at: date, comments: [] });
        }
    );
});

// 更新文章/碎碎念
app.put('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const updated_at = new Date().toISOString();
    
    db.run(
        `UPDATE posts SET title = ?, content = ?, updated_at = ? WHERE id = ?`,
        [title || '', content, updated_at, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, updated_at });
        }
    );
});

// 删除文章/碎碎念
app.delete('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    
    // 先删除相关评论
    db.run(
        `DELETE FROM comments WHERE post_id = ? AND post_type IN ('thoughts', 'articles')`,
        [id],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // 再删除文章
            db.run(
                `DELETE FROM posts WHERE id = ?`,
                [id],
                function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ success: true });
                }
            );
        }
    );
});

// 添加评论
app.post('/api/comments', (req, res) => {
    const { post_id, post_type, author, content } = req.body;
    const date = new Date().toISOString();
    
    db.run(
        `INSERT INTO comments (post_id, post_type, author, content, date) VALUES (?, ?, ?, ?, ?)`,
        [post_id, post_type, author, content, date],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, post_id, post_type, author, content, date });
        }
    );
});

// 获取所有相册
app.get('/api/albums', (req, res) => {
    db.all(
        `SELECT * FROM albums ORDER BY date DESC`,
        [],
        (err, albums) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const albumsWithPhotosAndComments = albums.map(album => {
                return new Promise((resolve) => {
                    // 获取照片
                    db.all(
                        `SELECT * FROM photos WHERE album_id = ?`,
                        [album.id],
                        (err, photos) => {
                            // 获取评论
                            db.all(
                                `SELECT * FROM comments WHERE post_id = ? AND post_type = 'gallery' ORDER BY date ASC`,
                                [album.id],
                                (err, comments) => {
                                    resolve({ 
                                        ...album, 
                                        photos: photos || [], 
                                        comments: comments || [] 
                                    });
                                }
                            );
                        }
                    );
                });
            });
            
            Promise.all(albumsWithPhotosAndComments).then(results => {
                res.json(results);
            });
        }
    );
});

// 创建相册
app.post('/api/albums', upload.array('photos', 20), (req, res) => {
    const { author, description } = req.body;
    const date = new Date().toISOString();
    
    db.run(
        `INSERT INTO albums (author, description, date) VALUES (?, ?, ?)`,
        [author, description || '', date],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const albumId = this.lastID;
            const photos = req.files.map(file => file.filename);
            
            // 插入照片记录
            const stmt = db.prepare(`INSERT INTO photos (album_id, filename) VALUES (?, ?)`);
            photos.forEach(filename => {
                stmt.run(albumId, filename);
            });
            stmt.finalize();
            
            res.json({ 
                id: albumId, 
                author, 
                description, 
                date, 
                photos: photos.map(filename => ({ filename }))
            });
        }
    );
});

// 删除相册
app.delete('/api/albums/:id', (req, res) => {
    const { id } = req.params;
    
    // 先获取相册的照片文件名
    db.all(
        `SELECT filename FROM photos WHERE album_id = ?`,
        [id],
        (err, photos) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // 删除物理文件
            photos.forEach(photo => {
                const filePath = path.join(__dirname, 'uploads', photo.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
            
            // 删除评论
            db.run(
                `DELETE FROM comments WHERE post_id = ? AND post_type = 'gallery'`,
                [id],
                (err) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    // 删除照片记录
                    db.run(
                        `DELETE FROM photos WHERE album_id = ?`,
                        [id],
                        (err) => {
                            if (err) {
                                res.status(500).json({ error: err.message });
                                return;
                            }
                            
                            // 删除相册
                            db.run(
                                `DELETE FROM albums WHERE id = ?`,
                                [id],
                                function(err) {
                                    if (err) {
                                        res.status(500).json({ error: err.message });
                                        return;
                                    }
                                    res.json({ success: true });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('数据库连接已关闭');
        process.exit(0);
    });
});
