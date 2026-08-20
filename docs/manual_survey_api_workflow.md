# Panduan Frontend: Survei Manual Indonesia

Base path: `/api/v1/manual-survey`

Workflow ini berdiri sendiri dari menu upload dataset. Jangan memanggil endpoint
`/datasets/*` atau `/experiments/*` dari halaman survei manual. Semua respons sukses
dibungkus sebagai `{ "success": true, "data": ..., "meta": ... }`.

## Struktur menu yang disarankan

1. **Data Survei**: form tambah/edit dan tabel CRUD.
2. **Analisis Data**: preview, profiling, EDA, rekomendasi config, dan preview kelas IPK.
3. **Training**: pemilihan data, konfirmasi config, dan eksekusi training.
4. **Hasil Training**: daftar run, metrik, confusion matrix, feature importance, dan pohon keputusan.

Halaman manual survey tidak meminta pengguna mengisi `project_id`. Frontend menghilangkan
field tersebut dari payload input dan backend otomatis memakai proyek default
`Survei Manual Indonesia`, serta membuatnya bila belum tersedia. `project_id` hanya dipakai
secara internal oleh backend atau sebagai filter opsional untuk kebutuhan administrasi.

## Model isian

```ts
type ManualSurveyInput = {
  name: string;
  age: number;                         // 15–100
  gender: string;
  daily_screen_time_hours: number;     // 0–24
  social_media_hours: number;          // 0–24
  online_study_hours: number;          // 0–24
  gaming_hours: number;                // 0–24
  sleep_hours: number;                 // 0–24
  attendance_percentage: number;       // 0–100
  offline_study_hours: number;         // 0–24
  previous_cgpa: number;               // 0–4, maksimal 2 desimal
  current_cgpa: number;                // 0–4, maksimal 2 desimal
};
```

Data hasil baca juga memiliki `id`, `created_at`, dan `updated_at`.

## Hasil smoke test dataset teman.xlsx

Smoke test dijalankan pada 20 Agustus 2026 menggunakan `dataset teman.xlsx`.
Kolom Excel `Nama`, `previous_sem_CGPA`, dan `current_sem_CGPA` dipetakan ke
`name`, `previous_cgpa`, dan `current_cgpa`. `project_id` sengaja tidak dikirim
untuk memastikan pengisian otomatis berjalan.

| Pemeriksaan | Hasil |
|---|---:|
| Baris dibaca dari Excel | 6 |
| Baris berhasil disimpan | 6 |
| Proyek otomatis | `Survei Manual Indonesia` |
| Kolom hasil profiling | 12 |
| Sel kosong | 0 |
| Baris duplikat | 0 |

Data uji yang digunakan:

| Nama | Gender | Usia | Previous CGPA | Current CGPA |
|---|---|---:|---:|---:|
| Ridwan Hakim | male | 21 | 3.1 | 3.3 |
| Fathur Prayoga | male | 20 | 2.8 | 2.7 |
| Reiza Pradipta | male | 22 | 3.7 | 3.8 |
| Nirmala Devi | female | 21 | 3.0 | 3.1 |
| Milva Apriyani | female | 23 | 2.5 | 2.4 |
| Suci Indriani | female | 20 | 3.5 | 3.6 |

Endpoint yang diverifikasi:

1. `GET /health/ready` menghasilkan status database `connected`.
2. `POST /manual-survey/responses/bulk` berhasil tanpa `project_id`.
3. `GET /manual-survey/dataset/table?project_id={uuid}` menghasilkan 6 baris.
4. `POST /manual-survey/dataset/profile?project_id={uuid}` menghasilkan 0 sel kosong dan 0 duplikasi.

| Nilai current CGPA | Kelas |
|---:|---|
| 0,00–1,00 | Rendah |
| 1,01–2,75 | Sedang |
| 2,76–4,00 | Tinggi |

## CRUD data survei

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/responses` | Tambah satu respons |
| `POST` | `/responses/bulk` | Tambah banyak respons |
| `GET` | `/responses?project_id={uuid}` | Daftar respons |
| `GET` | `/responses/{response_id}` | Detail respons |
| `PATCH` | `/responses/{response_id}` | Edit field tertentu |
| `DELETE` | `/responses/{response_id}` | Hapus respons, sukses `204` tanpa body |

Contoh tambah satu data:

```json
{
  "name": "Budi Santoso",
  "age": 20,
  "gender": "Laki-laki",
  "daily_screen_time_hours": 6,
  "social_media_hours": 2,
  "online_study_hours": 2,
  "gaming_hours": 1,
  "sleep_hours": 8,
  "attendance_percentage": 90,
  "offline_study_hours": 2,
  "previous_cgpa": 3.1,
  "current_cgpa": 3.2
}
```

Bulk memakai bentuk `{ "responses": [ManualSurveyInput, ...] }`. `project_id` tidak perlu
dikirim pada create tunggal, bulk import, maupun training dari halaman manual survey.
Payload `PATCH` hanya perlu berisi field yang berubah.

## Display dan analisis dataset database

| Method | Endpoint | Kegunaan frontend |
|---|---|---|
| `GET` | `/dataset/table?page=1&page_size=50&project_id={uuid}` | Tabel paginated lengkap dengan metadata CRUD |
| `GET` | `/dataset/preview?limit=20&project_id={uuid}` | Preview kolom ML tanpa metadata database |
| `POST` | `/dataset/profile?project_id={uuid}` | Ringkasan tipe, missing value, dan statistik |
| `GET` | `/dataset/eda-visualization?project_id={uuid}` | Payload chart EDA |
| `POST` | `/dataset/recommend-config?project_id={uuid}` | Config baku `survey_indonesia` |
| `GET` | `/dataset/target-conversion-preview?project_id={uuid}` | Distribusi Rendah/Sedang/Tinggi |

Urutan halaman Analisis Data:

1. Muat `/dataset/table` untuk display utama.
2. Panggil `/dataset/profile` dan `/dataset/eda-visualization`.
3. Panggil `/dataset/recommend-config`, lalu simpan objek `data` sebagai config training.
4. Tampilkan `/dataset/target-conversion-preview` untuk konfirmasi distribusi kelas.
5. Aktifkan tombol training hanya jika seluruh request berhasil.

Jika belum ada respons, endpoint proses mengembalikan `422`. Frontend harus mengarahkan
pengguna kembali ke form survei.

## Training

`POST /training/runs`

Training seluruh data pada suatu proyek dengan config baku backend:

```json
{
  "run_name": "Survei Indonesia Agustus 2026",
  "project_id": "00000000-0000-0000-0000-000000000000"
}
```

Training baris terpilih:

```json
{
  "run_name": "Training Data Terpilih",
  "project_id": "00000000-0000-0000-0000-000000000000",
  "response_ids": [
    "00000000-0000-0000-0000-000000000001",
    "00000000-0000-0000-0000-000000000002"
  ]
}
```

`response_ids` minimal dua ID. Bila `config` dikirim, gunakan persis objek dari
`/dataset/recommend-config`; `config.preset` wajib `survey_indonesia`. Backend membaca
baris langsung dari database lalu menjalankan normalisasi, transformasi target,
train-test split, Decision Tree, dan penyimpanan hasil yang sama dengan mesin upload.

Training dapat gagal bila jumlah data atau jumlah anggota tiap kelas tidak cukup untuk
split stratified. Tampilkan pesan error backend dan sarankan penambahan respons.

## Hasil training terpisah

| Method | Endpoint |
|---|---|
| `GET` | `/training/runs` |
| `GET` | `/training/runs/{run_id}` |
| `GET` | `/training/runs/{run_id}/preprocessing-summary` |
| `GET` | `/training/runs/{run_id}/confusion-matrix` |
| `GET` | `/training/runs/{run_id}/metrics` |
| `GET` | `/training/runs/{run_id}/feature-importance` |
| `GET` | `/training/runs/{run_id}/tree-visualization` |
| `GET` | `/training/runs/{run_id}/workflow-visualization` |

Daftar ini hanya mengembalikan run dengan `source_type = "manual_survey"`. Run upload
tidak muncul dan ID run upload menghasilkan `404` bila dibuka melalui endpoint ini.
Sebaliknya, endpoint lama `/api/v1/experiments/runs` hanya mengembalikan dan menerima
run dengan `source_type = "upload"`; run survei manual tidak dapat dibuka dari menu upload.

## State frontend minimum

```ts
type ManualSurveyPageState = {
  tablePage: number;
  selectedResponseIds: string[];
  profile: unknown | null;
  eda: unknown | null;
  config: unknown | null;
  targetPreview: unknown | null;
  activeRunId: string | null;
};
```

Reset `profile`, `eda`, `config`, dan `targetPreview` setelah create, update, atau delete
karena data sumber sudah berubah. Halaman manual survey selalu memuat dataset proyek default
dan tidak menyediakan pergantian `projectId` kepada pengguna.
Jangan menggabungkan cache query survei manual dengan cache `/datasets` atau
`/experiments` milik workflow upload.

## Penanganan status

- `201`: create, bulk create, atau training berhasil.
- `204`: delete berhasil; jangan mencoba membaca JSON response.
- `404`: response/run tidak ditemukan atau run berasal dari workflow lain.
- `422`: validasi isian, data kosong, pilihan ID lintas proyek, config salah, atau data belum cukup.
- Tampilkan pesan error backend dan simpan `meta.request_id` untuk debugging.
