export type MetricCard = {
  label: string
  value: string
  note: string
  tone: string
}

export type StageItem = {
  code: string
  title: string
  summary: string
  progress: number
  status: 'completed' | 'running' | 'queued'
}

export type ProcessStep = {
  code: string
  title: string
  description: string
  route: string
}

export type TreeNode = {
  id: number
  depth: number
  title: string
  condition: string
  predictedClass: string
  samples: number
  impurity: number
  confidence: string
  accent: string
}

export const heroMetrics: MetricCard[] = [
  { label: 'Accuracy', value: '72.12%', note: 'Testing split 104 rows', tone: 'from-emerald-400/30 to-emerald-500/10' },
  { label: 'Macro F1', value: '50.19%', note: 'Balanced view across classes', tone: 'from-amber-400/30 to-amber-500/10' },
  { label: 'Tree Depth', value: '4', note: 'Readable and export-friendly', tone: 'from-cyan-400/30 to-cyan-500/10' },
  { label: 'Artifacts', value: '11', note: 'Model, visuals, and reports', tone: 'from-fuchsia-400/30 to-fuchsia-500/10' },
]

export const pipelineStages: StageItem[] = [
  { code: '01', title: 'Upload Dataset', summary: 'CSV/XLSX divalidasi, disimpan dengan checksum SHA-256, lalu sheet dibaca.', progress: 100, status: 'completed' },
  { code: '02', title: 'Profile Columns', summary: 'Inferensi tipe, missing ratio, cardinality, distribusi, dan recommendation evidence.', progress: 100, status: 'completed' },
  { code: '03', title: 'Confirm Config', summary: 'User mengonfirmasi target, identifier, ordinal order, dan strategi preprocessing.', progress: 100, status: 'completed' },
  { code: '04', title: 'Train Pipeline', summary: 'ColumnTransformer dan DecisionTreeClassifier dijalankan tanpa data leakage.', progress: 76, status: 'running' },
  { code: '05', title: 'Evaluate + Export', summary: 'Confusion matrix, rules, feature importance, predictions, PDF, dan SVG tree.', progress: 42, status: 'queued' },
]

export const processSteps: ProcessStep[] = [
  {
    code: '1',
    title: 'Exploratory Data Analysis (EDA)',
    description: 'Profiling struktur dataset, distribusi kolom, missing value, dan karakteristik fitur sebelum training.',
    route: '/',
  },
  {
    code: '2',
    title: 'Preprocessing Data',
    description: 'Imputasi, encoding, dan penyiapan fitur dilakukan dengan pipeline yang aman dari data leakage.',
    route: '/config-studio',
  },
  {
    code: '3',
    title: 'Konversi CGPA ke Kategori',
    description: 'Nilai target diubah menjadi label kategorikal yang sesuai dengan kebutuhan klasifikasi.',
    route: '/config-studio',
  },
  {
    code: '4',
    title: 'Pembangunan Model Decision Tree',
    description: 'DecisionTreeClassifier dilatih menggunakan konfigurasi split, criterion, dan hyperparameter yang dipilih.',
    route: '/pipeline',
  },
  {
    code: '5',
    title: 'Confusion Matrix',
    description: 'Hasil prediksi dibandingkan dengan label aktual untuk melihat distribusi benar dan salah klasifikasi.',
    route: '/evaluation-lab',
  },
  {
    code: '6',
    title: 'Accuracy, Precision, Recall, dan F1-Score',
    description: 'Metrik evaluasi utama ditampilkan untuk membaca performa model secara agregat dan per kelas.',
    route: '/evaluation-lab',
  },
  {
    code: '7',
    title: 'Visualisasi Pohon Keputusan',
    description: 'Node, cabang, dan aturan keputusan ditampilkan agar model mudah dijelaskan ke pengguna.',
    route: '/tree-explorer',
  },
]

export const classDistributionSeries = [
  { name: 'Overall', data: [111, 304] },
  { name: 'Train', data: [83, 232] },
  { name: 'Test', data: [28, 72] },
]

export const classDistributionOptions = {
  chart: {
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'Poppins, sans-serif',
  },
  colors: ['#f4a261', '#2a9d8f', '#7dd3fc'],
  dataLabels: { enabled: false },
  grid: {
    borderColor: 'rgba(255,255,255,0.08)',
    strokeDashArray: 4,
  },
  plotOptions: {
    bar: {
      borderRadius: 10,
      horizontal: false,
      columnWidth: '46%',
    },
  },
  xaxis: {
    categories: ['Tidak', 'Ya'],
    labels: { style: { colors: ['#cbd5e1', '#cbd5e1'] } },
  },
  yaxis: {
    labels: { style: { colors: ['#94a3b8'] } },
  },
  legend: {
    labels: { colors: '#e2e8f0' },
  },
}

export const featureImportanceSeries = [
  {
    name: 'Importance',
    data: [0.28, 0.21, 0.16, 0.13, 0.09, 0.07],
  },
]

export const featureImportanceOptions = {
  chart: {
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'Poppins, sans-serif',
  },
  colors: ['#2a9d8f'],
  dataLabels: {
    enabled: true,
    formatter: (value: number) => `${(value * 100).toFixed(0)}%`,
  },
  grid: {
    borderColor: 'rgba(255,255,255,0.08)',
    strokeDashArray: 4,
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 8,
    },
  },
  xaxis: {
    categories: [
      'persepsi_pengaruh_akademik',
      'durasi_medsos_jam',
      'durasi_tidur_jam',
      'semester',
      'program_studi',
      'frekuensi_belajar',
    ],
    labels: { style: { colors: ['#94a3b8'] } },
  },
  yaxis: {
    labels: { style: { colors: ['#e2e8f0'] } },
  },
}

export const confusionMatrix = [
  [
    { value: 3, label: 'Actual Tidak / Pred Tidak', emphasis: 'low' },
    { value: 25, label: 'Actual Tidak / Pred Ya', emphasis: 'alert' },
  ],
  [
    { value: 4, label: 'Actual Ya / Pred Tidak', emphasis: 'mid' },
    { value: 72, label: 'Actual Ya / Pred Ya', emphasis: 'high' },
  ],
]

export const treeNodes: TreeNode[] = [
  {
    id: 0,
    depth: 0,
    title: 'Root Node',
    condition: 'persepsi_pengaruh_akademik <= 0.5',
    predictedClass: 'Ya',
    samples: 415,
    impurity: 0.3919,
    confidence: '73.3% Ya',
    accent: 'from-cyan-400/30 to-cyan-500/5',
  },
  {
    id: 1,
    depth: 1,
    title: 'Branch A',
    condition: 'durasi_medsos_jam > 4',
    predictedClass: 'Tidak',
    samples: 97,
    impurity: 0.4681,
    confidence: '58.8% Tidak',
    accent: 'from-orange-400/30 to-orange-500/5',
  },
  {
    id: 12,
    depth: 1,
    title: 'Branch B',
    condition: 'durasi_tidur_jam > 6',
    predictedClass: 'Ya',
    samples: 318,
    impurity: 0.2622,
    confidence: '83.0% Ya',
    accent: 'from-emerald-400/30 to-emerald-500/5',
  },
  {
    id: 8,
    depth: 2,
    title: 'Leaf Node',
    condition: 'semester <= 4',
    predictedClass: 'Tidak',
    samples: 21,
    impurity: 0.2857,
    confidence: '71.4% Tidak',
    accent: 'from-fuchsia-400/30 to-fuchsia-500/5',
  },
]

export const ruleCards = [
  {
    title: 'Rule 08',
    prediction: 'Predicted class: Tidak',
    support: '21 samples',
    conditions: ['durasi_medsos_jam > 4', 'durasi_tidur_jam <= 6', 'semester <= 4'],
  },
  {
    title: 'Rule 15',
    prediction: 'Predicted class: Ya',
    support: '88 samples',
    conditions: ['persepsi_pengaruh_akademik > 0.5', 'durasi_tidur_jam > 6'],
  },
  {
    title: 'Rule 21',
    prediction: 'Predicted class: Ya',
    support: '52 samples',
    conditions: ['program_studi = Informatika', 'frekuensi_belajar >= 3'],
  },
]

export const configHighlights = [
  { key: 'task.target_column', value: 'IPK_baik', description: 'Positive class wajib dikonfirmasi user.' },
  { key: 'preprocessing.numeric_missing', value: 'median', description: 'Fit hanya pada training set untuk mencegah leakage.' },
  { key: 'split.test_size', value: '0.2', description: 'Stratified train/test split dengan random_state 42.' },
  { key: 'model.max_depth', value: '4', description: 'Depth dibatasi agar interpretasi tetap mudah.' },
]

export const configJson = `{
  "schema_version": "1.0",
  "task": {
    "type": "classification",
    "target_column": "IPK_baik",
    "positive_class": "Ya"
  },
  "cleaning": {
    "remove_duplicates": true,
    "drop_constant_columns": true,
    "target_missing_strategy": "drop_row"
  },
  "split": {
    "method": "train_test",
    "test_size": 0.2,
    "stratify": true,
    "random_state": 42
  },
  "model": {
    "algorithm": "decision_tree_classifier",
    "criterion": "gini",
    "max_depth": 4,
    "min_samples_leaf": 5
  }
}`

export const moduleMap = [
  { name: 'datasets', role: 'Upload, preview, profiling, recommend-config' },
  { name: 'configurations', role: 'Draft, validate, activate, compare versions' },
  { name: 'training', role: 'Build pipeline, fit model, serialize artifact' },
  { name: 'evaluation', role: 'Confusion matrix, metrics, report payloads' },
  { name: 'visualization', role: 'Tree nodes, rules, importance, workflow UI data' },
  { name: 'workers', role: 'Async profiling, experiment runs, report generation' },
]

export const apiEndpointGroups = [
  {
    title: 'Datasets',
    endpoints: [
      'POST /api/v1/datasets/upload',
      'GET /api/v1/datasets/{dataset_id}/profile',
      'POST /api/v1/datasets/{dataset_id}/recommend-config',
    ],
  },
  {
    title: 'Configurations',
    endpoints: [
      'POST /api/v1/datasets/{dataset_id}/configs',
      'POST /api/v1/configs/{config_version_id}/validate',
      'POST /api/v1/configs/{config_version_id}/activate',
    ],
  },
  {
    title: 'Runs + Results',
    endpoints: [
      'POST /api/v1/experiments/runs',
      'GET /api/v1/runs/{run_id}/evaluation',
      'GET /api/v1/runs/{run_id}/tree',
      'GET /api/v1/runs/{run_id}/rules',
    ],
  },
]
