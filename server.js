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
    accessKeyId: 'AKIAQTIAIAT6627V3B4K',
    secretAccessKey: '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',
    region: 'ap-southeast-2' // Ganti ke 'ap-southeast-1' JIKA bucket Anda di Singapore
});

// Menggunakan memoryStorage agar file tidak membebani hardisk EC2
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// KONFIGURASI DATABASE RDS (MYSQL)
// ==========================================
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('❌ Gagal terhubung ke RDS MySQL:', err.message);
        return;
    }
    console.log('✅ Berhasil terhubung ke database RDS MySQL');
    
    // Auto-migrate: Buat tabel jika belum ada di database
    const sqlCreateTable = `
        CREATE TABLE IF NOT EXISTS laporan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama_pelapor VARCHAR(100) NOT NULL,
            deskripsi TEXT NOT NULL,
            foto_url VARCHAR(255) NOT NULL,
            tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.query(sqlCreateTable, (err, result) => {
        if (err) console.error('❌ Gagal memeriksa/membuat tabel:', err);
        else console.log('✅ Tabel "laporan" siap digunakan');
    });
});

// ==========================================
// ROUTING (ALUR HALAMAN)
// ==========================================

// 1. Tampilkan Halaman Utama (Dashboard)
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM laporan ORDER BY tanggal DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Terjadi kesalahan pada server database.');
        }
        res.render('index', { laporan: results });
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
        ContentType: file.mimetype,
        // Pastikan file S3 bisa dibaca publik agar muncul di website
        ACL: 'public-read' 
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

// ==========================================
// JALANKAN SERVER
// ==========================================
app.listen(port, () => {
    console.log(`\n🚀 Server SehatLingkungan menyala di Port ${port}`);
    console.log(`=================================================`);
});