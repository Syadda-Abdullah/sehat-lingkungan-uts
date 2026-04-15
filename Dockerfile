# Menggunakan base image Node.js versi 18 yang ringan (Alpine Linux)
FROM node:18-alpine

# Menentukan direktori kerja di dalam kontainer
WORKDIR /usr/src/app

# Menyalin file package.json terlebih dahulu untuk optimasi cache Docker
COPY package*.json ./

# Menginstal semua dependensi aplikasi
RUN npm install --production

# Menyalin seluruh kode sumber ke dalam kontainer
COPY . .

# Membuka port 80 agar bisa diakses langsung via HTTP
EXPOSE 80

# Perintah utama untuk menjalankan server
CMD ["node", "server.js"]