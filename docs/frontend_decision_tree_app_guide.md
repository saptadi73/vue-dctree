# Frontend Decision Tree App Guide

## Ringkasan

Frontend ini menerjemahkan isi dokumen [fastapi_ml_decision_tree_technical_design.md](./fastapi_ml_decision_tree_technical_design.md) menjadi aplikasi Vue yang informatif, presentable, dan siap dihubungkan ke backend FastAPI.

Tujuan utamanya:

- menampilkan alur dataset sampai evaluasi model secara visual;
- mempermudah pembacaan kontrak backend untuk tim frontend;
- menyiapkan struktur halaman yang cocok untuk integrasi API nyata;
- menjaga istilah, state, dan artefak tetap konsisten dengan dokumen teknis.

## Halaman yang dibuat

### 1. Overview

Menampilkan:

- narasi produk;
- KPI utama seperti accuracy, macro F1, tree depth, dan artifacts;
- distribusi kelas overall/train/test;
- progress board pipeline asinkron.

### 2. Pipeline

Menampilkan:

- urutan workflow aplikasi;
- state lifecycle dataset;
- state lifecycle konfigurasi;
- state lifecycle experiment run;
- prinsip desain yang memengaruhi perilaku UI.

### 3. Config Studio

Menampilkan:

- konsep configuration-driven pipeline;
- highlight field konfigurasi penting;
- potongan JSON kanonis;
- pemisahan error validasi vs warning.

### 4. Tree Explorer

Menampilkan:

- representasi node decision tree;
- informasi node seperti depth, impurity, predicted class, dan samples;
- kartu decision rules root-to-leaf.

### 5. Evaluation Lab

Menampilkan:

- confusion matrix dengan orientasi eksplisit;
- aggregate metrics;
- classification report per kelas;
- feature importance chart.

### 6. API Atlas

Menampilkan:

- peta modul backend;
- kelompok endpoint yang paling penting untuk integrasi frontend;
- catatan SSE dan artifact download.

## Struktur frontend

```text
src/
  components/
    MetricTile.vue
    SectionCard.vue
  data/
    decisionTreeDemo.ts
  views/
    OverviewView.vue
    PipelineView.vue
    ConfigStudioView.vue
    TreeExplorerView.vue
    EvaluationLabView.vue
    ApiAtlasView.vue
  App.vue
  router/index.ts
```

## Prinsip implementasi UI

### 1. Dokumen sebagai source of truth

Semua copy, state, istilah, dan visual mengikuti dokumen backend, bukan asumsi bebas.

### 2. Visual payload first

Frontend ini diasumsikan akan menerima:

- nodes;
- metrics;
- class distributions;
- rules;
- endpoint results;
- progress events.

Karena itu struktur komponen dirancang untuk merender data, bukan HTML yang dikirim backend.

### 3. Presentasi yang kuat untuk reviewer

Desain dibuat gelap, kontras, dan berlapis agar cocok untuk:

- demo stakeholder;
- presentasi teknis;
- diskusi lintas frontend-backend;
- pembahasan acceptance criteria MVP.

## Mapping ke dokumen backend

| Area dokumen | Implementasi di frontend |
|---|---|
| Workflow aplikasi | `PipelineView.vue` |
| Konfigurasi JSON | `ConfigStudioView.vue` |
| Evaluasi model | `EvaluationLabView.vue` |
| Decision tree dan rules | `TreeExplorerView.vue` |
| Integrasi frontend | `OverviewView.vue` dan `ApiAtlasView.vue` |

## Langkah integrasi backend selanjutnya

1. Ganti data statis di `src/data/decisionTreeDemo.ts` dengan response API nyata.
2. Tambahkan service layer untuk endpoint `/datasets`, `/configs`, `/runs`, dan `/artifacts`.
3. Tambahkan store untuk state run aktif, selected config version, dan selected dataset.
4. Hubungkan progress board ke SSE `/api/v1/runs/{run_id}/events`.
5. Tambahkan mode detail untuk preview data, misclassification table, dan per-node inspector.

## Saran pengembangan berikutnya

Pengembangan yang paling natural setelah versi ini:

- wizard upload dataset;
- editor JSON + form sinkron dua arah;
- tree canvas interaktif dengan pan/zoom;
- compare experiment runs;
- halaman artifacts dan report center;
- integrasi role-based access dan project switcher.
