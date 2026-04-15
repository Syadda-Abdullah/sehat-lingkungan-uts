# 🏥 SehatLingkungan - Cloud-Based Health Reporting System
> **Tugas Evaluasi 1 (UTS) - Mata Kuliah Cloud Computing (IFB452)**

[![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

**SehatLingkungan** adalah platform digital partisipatif yang memungkinkan masyarakat melaporkan masalah kesehatan lingkungan (seperti penumpukan sampah liar, drainase buruk, atau sanitasi yang tidak layak) secara real-time. Aplikasi ini dibangun dengan arsitektur Cloud Native untuk menjamin ketersediaan tinggi dan skalabilitas.

---

## 🏗️ Cloud Infrastructure Architecture
Proyek ini mengimplementasikan infrastruktur AWS yang kompleks namun terstruktur:

* **VPC (Virtual Private Cloud):** Segmentasi jaringan khusus (10.0.0.0/16).
* **Public Subnet:** Menampung **Amazon EC2** (Ubuntu) yang menjalankan aplikasi di dalam container Docker, dapat diakses via Internet Gateway.
* **Private Subnet:** Menampung **Amazon RDS (MySQL)** untuk memastikan database terisolasi dari akses publik langsung demi keamanan data.
* **Amazon S3:** Penyimpanan objek untuk aset statis (Gambar & Dokumen PDF) laporan masyarakat.
* **IAM (Identity and Access Management):** Implementasi kebijakan hak akses terbatas untuk aplikasi menggunakan IAM User khusus.

---

## 🛠️ Tech Stack & Automation
- **Backend:** Node.js & Express.js
- **Frontend:** EJS Template Engine & Tailwind CSS (Modern UI)
- **Database:** MySQL (Amazon RDS)
- **Storage:** Amazon S3
- **Containerization:** Docker
- **CI/CD Pipeline:** GitHub Actions (Otomatis membangun image ke Docker Hub dan mendeploy ke EC2 setiap ada `git push`).

---

## 🚀 Deployment Link
Aplikasi dapat diakses secara online melalui infrastruktur AWS:
🔗 **[Live Demo Aplikasi](http://13.236.84.107)**

---

## ⚙️ Cara Menjalankan Secara Lokal
Jika Anda ingin menjalankan proyek ini di lingkungan lokal:

1. **Clone Repositori:**
   ```bash
   git clone [https://github.com/Syadda-Abdullah/sehat-lingkungan-uts.git](https://github.com/Syadda-Abdullah/sehat-lingkungan-uts.git)
   cd sehat-lingkungan-uts
