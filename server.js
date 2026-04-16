require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 80;

// ==========================================
// KONFIGURASI ENGINE & MIDDLEWARE
// ==========================================
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==========================================
// KONFIGURASI AWS S3 & MULTER (UPLOAD)
// ==========================================
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-southeast-2' 
});

// Menggunakan memoryStorage agar file tidak membebani hardisk EC2
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// KONFIGURASI DATABASE RDS (MYSQL)
// ==========================================
// Menggunakan createPool agar koneksi otomatis tersambung kembali jika putus
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Cek koneksi pool
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Gagal terhubung ke RDS MySQL:', err.message);
        return;
    }
    console.log('✅ Berhasil terhubung ke database RDS MySQL (Pool)');
    
    const sqlCreateTable = `
        CREATE TABLE IF NOT EXISTS laporan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama_pelapor VARCHAR(100) NOT NULL,
            deskripsi TEXT NOT NULL,
            foto_url VARCHAR(255) NOT NULL,
            tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    connection.query(sqlCreateTable, (err) => {
        connection.release(); // Kembalikan koneksi ke pool
        if (err) console.error('❌ Gagal memeriksa/membuat tabel:', err);
        else console.log('✅ Tabel "laporan" siap digunakan');
    });
});

// ==========================================
// ROUTING (ALUR HALAMAN)
// ==========================================

// 1. Tampilkan Halaman Utama & Statistik Dashboard
app.get('/', (req, res) => {
    const sqlLaporan = 'SELECT * FROM laporan ORDER BY tanggal DESC';
    const sqlStats = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN foto_url LIKE '%.pdf' THEN 1 ELSE 0 END) as pdf_count,
            SUM(CASE WHEN foto_url NOT LIKE '%.pdf' THEN 1 ELSE 0 END) as img_count
        FROM laporan
    `;

    db.query(sqlLaporan, (err, results) => {
        if (err) return res.status(500).send('Error Database');

        db.query(sqlStats, (err, stats) => {
            // Berikan nilai default 0 jika stats tidak ditemukan atau error
            const reportStats = (stats && stats[0]) ? stats[0] : { total: 0, pdf_count: 0, img_count: 0 };
            
            res.render('index', { 
                laporan: results || [], 
                stats: stats[0] || { total: 0, pdf_count: 0, img_count: 0 } 
            });
        });
    });
});

// 2. Tangani Form Submit (Upload S3 + Insert RDS)
app.post('/lapor', upload.single('foto'), (req, res) => {
    const { nama_pelapor, deskripsi } = req.body;
    const file = req.file;

    if (!file) return res.status(400).send('Mohon sertakan foto bukti.');

    // Format nama file unik menggunakan Timestamp
    const fileName = `laporan_lingkungan_${Date.now()}${path.extname(file.originalname)}`;
    
    const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype, // Ini krusial agar browser tahu itu PDF atau Gambar
    ACL: 'public-read',
    ContentDisposition: 'inline' // Tambahkan ini agar file dibuka di browser (inline), bukan dipaksa download
    };

    console.log(`Mulai mengunggah file ${fileName} ke S3...`);

    // Proses Upload ke S3
    s3.upload(s3Params, (err, data) => {
        if (err) {
            console.error('❌ Error S3:', err);
            return res.status(500).send('Gagal menyimpan foto ke layanan Cloud S3.');
        }

        console.log('✅ Berhasil upload ke S3. URL:', data.Location);

        // Jika berhasil di S3, simpan data pelapor dan URL foto ke RDS
        const sqlInsert = 'INSERT INTO laporan (nama_pelapor, deskripsi, foto_url) VALUES (?, ?, ?)';
        db.query(sqlInsert, [nama_pelapor, deskripsi, data.Location], (err, result) => {
            if (err) {
                console.error('❌ Error RDS:', err);
                return res.status(500).send('Gagal menyimpan data ke Database RDS.');
            }
            console.log('✅ Data laporan berhasil direkam ke database.');
            res.redirect('/'); // Kembalikan pengguna ke halaman utama
        });
    });
});

// 3. UPDATE: Mengubah deskripsi laporan
app.post('/edit/:id', (req, res) => {
    const { id } = req.params;
    const { deskripsi } = req.body;
    const sql = 'UPDATE laporan SET deskripsi = ? WHERE id = ?';
    
    db.query(sql, [deskripsi, id], (err, result) => {
        if (err) {
            console.error('❌ Error Update:', err);
            return res.status(500).send(err);
        }
        res.json({ message: 'Laporan berhasil diperbarui' });
    });
});

// 4. DELETE: Menghapus laporan dari database
app.post('/hapus/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM laporan WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('❌ Error Delete:', err);
            return res.status(500).send(err);
        }
        res.json({ message: 'Laporan berhasil dihapus' });
    });
});

// ==========================================
// JALANKAN SERVER
// ==========================================
app.listen(port, () => {
    console.log(`\n🚀 Server SehatLingkungan menyala di Port ${port}`);
    console.log(`=================================================`);
});