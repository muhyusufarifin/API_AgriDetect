# 🌱 APIPlantDieses - Plant Disease Detection API

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?style=for-the-badge&logo=nodedotjs)
![Express.js](https://img.shields.io/badge/Express.js-4.x-blue?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green?style=for-the-badge&logo=mongodb)
![Mongoose](https://img.shields.io/badge/Mongoose-7.x-red?style=for-the-badge&logo=mongoose)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange?style=for-the-badge&logo=json-web-tokens)
![Multer](https://img.shields.io/badge/Multer-File%20Uploads-lightgrey?style=for-the-badge&logo=multer)

APIPlantDieses adalah RESTful API yang dirancang untuk mendeteksi penyakit tanaman berdasarkan gambar yang diunggah. API ini memanfaatkan model pembelajaran mesin (ML) untuk menganalisis gambar dan memberikan hasil diagnosis, serta menyediakan fitur otentikasi pengguna, riwayat analisis, dan pengelolaan data penyakit.

## ✨ Fitur Utama

* **Deteksi Penyakit Tanaman:** Mengunggah gambar tanaman untuk dianalisis oleh model ML dan mendapatkan hasil diagnosis.
* **Manajemen Pengguna:** Registrasi dan otentikasi pengguna menggunakan JSON Web Tokens (JWT).
* **Riwayat Analisis:** Menyimpan riwayat gambar yang diunggah dan hasil analisis untuk setiap pengguna.
* **Manajemen Data Penyakit:** Mengelola informasi detail tentang berbagai jenis penyakit tanaman.
* **Model ML Terintegrasi:** Terintegrasi dengan model `model.json` untuk inferensi.
* **Validasi Input:** Validasi data yang kuat untuk memastikan integritas dan keamanan.
* **Penanganan Error Global:** Penanganan error yang konsisten di seluruh API.

## 🚀 Persyaratan

Sebelum menjalankan proyek ini, pastikan Anda memiliki perangkat lunak berikut terinstal di sistem Anda:

* **Node.js**: Versi 18.x atau yang lebih baru.
* **npm** atau **Yarn**: Manajer paket untuk Node.js.
* **MongoDB**: Database NoSQL. Anda dapat menginstalnya secara lokal atau menggunakan layanan cloud seperti MongoDB Atlas.

## 📦 Instalasi

Ikuti langkah-langkah di bawah ini untuk menginstal dan menyiapkan proyek di lingkungan lokal Anda:

1.  **Klon Repositori:**
    ```bash
    git clone [https://github.com/muhyusufarifin/API_AgriDetect.git](https://github.com/muhyusufarifin/API_AgriDetect.git)
    cd API_AgriDetect
    ```

2.  **Buat Folder yang Diperlukan:**
    API ini memerlukan beberapa folder untuk penyimpanan data dan model. Pastikan Anda membuat folder-folder berikut di direktori root proyek (`APIPlantDieses`):

    ```bash
    mkdir uploads
    ```
    * `uploads/`: Digunakan oleh Multer untuk menyimpan gambar yang diunggah.

3.  **Instal Dependensi:**
    ```bash
    npm install
    # atau jika Anda menggunakan yarn
    # yarn install
    ```

4.  **Buat File `.env`:**
    Buat file bernama `.env` di direktori root proyek (`APIPlantDieses`). File ini akan berisi variabel lingkungan yang sensitif.

    ```bash
    touch .env
    ```
    
5.  **Membuat Kunci Rahasia JWT (Opsional, tapi Direkomendasikan):**
    Proyek ini dilengkapi dengan skrip kecil untuk menghasilkan kunci rahasia JWT yang kuat. Jalankan perintah berikut:

    ```bash
    node generate_secret.js
    ```
    Skrip akan mencetak kunci rahasia di konsol. Salin kunci tersebut dan tempelkan sebagai nilai `JWT_SECRET` di file `.env` Anda.

## ▶️ Menjalankan Server

Setelah instalasi dan konfigurasi selesai, Anda dapat menjalankan server API:

```bash
npm start
# atau
# node server.js
```

Server API akan mulai berjalan dan dapat diakses di http://localhost:5000 (atau port yang Anda tentukan di .env).

## 📁 Struktur Proyek

Berikut adalah gambaran umum struktur direktori proyek:
```bash
APIPlantDieses/
├── node_modules/           # Dependencies proyek
├── model/                  # Model ML yang digunakan untuk deteksi penyakit
│   └── model.json
├── uploads                 # Digunakan oleh Multer untuk menyimpan gambar yang diunggah. 
├── middleware/             # Middleware Express (misalnya otentikasi)
│   └── auth.js
├── models/                 # Definisi skema MongoDB (menggunakan Mongoose)
│   ├── AnalysisResult.js
│   ├── Disease.js
│   ├── Image.js
│   └── User.js
├── routes/                 # Definisi rute API
│   ├── analyze.js
│   ├── auth.js
│   └── images.js
├── .env                    # Variabel lingkungan (tidak diunggah ke Git)
├── .gitignore              # File dan folder yang diabaikan oleh Git
├── generate_secret.js      # Skrip untuk menghasilkan kunci JWT
├── package.json            # Metadata proyek dan dependensi
├── package-lock.json       # Log kunci dependensi
└── server.js               # Titik masuk utama aplikasi (server Express)
```

## 💡 Penggunaan API (Endpoint)

Berikut adalah beberapa endpoint API utama yang tersedia: 

**Autentikasi Pengguna (/api/auth)**
```bash
    POST /api/auth/register
        Deskripsi: Mendaftarkan pengguna baru.
        Body: {"username": "string", "email": "string", "password": "string"}
        Respon Sukses: { "token": "string", "user": { "_id": "string", "username": "string", "email": "string" } }

    POST /api/auth/login
        Deskripsi: Login pengguna dan mengembalikan token JWT.
        Body: {"email": "string", "password": "string"}
        Respon Sukses: { "token": "string", "user": { "_id": "string", "username": "string", "email": "string" } }
```

**Analisis Gambar (/api/analyze)**
```bash
    POST /api/analyze/upload
        Deskripsi: Mengunggah gambar tanaman untuk dianalisis.
        Headers: Authorization: Bearer <token_jwt> (diperlukan setelah login)
        Body: multipart/form-data dengan field image yang berisi file gambar.
        Respon Sukses: Mengembalikan detail hasil analisis, termasuk ID gambar, ID pengguna, hasil diagnosis, dan detail lainnya.
```

**Pengelolaan Gambar (/api/images)**
```bash
    GET /api/images
        Deskripsi: Mendapatkan semua gambar yang diunggah oleh pengguna yang terautentikasi.
        Headers: Authorization: Bearer <token_jwt>
        Respon Sukses: Array objek gambar.

    GET /api/images/:id
        Deskripsi: Mendapatkan detail gambar tertentu berdasarkan ID.
        Headers: Authorization: Bearer <token_jwt>
        Respon Sukses: Objek gambar.
```

**Pengelolaan Penyakit (/api/diseases)**
```bash
    GET /api/diseases
        Deskripsi: Mendapatkan daftar semua penyakit yang tersedia.
        Respon Sukses: Array objek penyakit.

    GET /api/diseases/:id
        Deskripsi: Mendapatkan detail penyakit tertentu berdasarkan ID.
        Respon Sukses: Objek penyakit.
```
(Catatan: Endpoint untuk menambahkan/mengupdate/menghapus penyakit mungkin ada atau bisa ditambahkan jika diperlukan oleh peran admin.)

## 🤝 Kontribusi

Kontribusi dipersilakan! Jika Anda ingin berkontribusi pada proyek ini, silakan ikuti langkah-langkah berikut:
```bash
    Fork repositori ini.
    Buat branch baru untuk fitur Anda (git checkout -b feature/nama-fitur).
    Lakukan perubahan Anda.
    Komit perubahan Anda (git commit -m 'feat: tambahkan fitur baru').
    Push ke branch Anda (git push origin feature/nama-fitur).
    Buka Pull Request.
```
