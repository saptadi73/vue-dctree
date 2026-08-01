import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { API_BASE_URL, decisionTreeApi } from '../lib/api'

const sampleConfigJson = `{
  "schema_version": "1.0",
  "task": {
    "type": "classification",
    "target_column": "Apakah Anda merasa prestasi akademik (IPK) Anda baik?",
    "positive_class": "Ya"
  },
  "preprocessing": {
    "mode": "strict",
    "collapse_rare_study_programs": true,
    "simplify_social_media_platforms": true,
    "normalize_binary_labels": true,
    "normalize_duration_buckets": true
  },
  "columns": [
    { "name": "Nama :", "data_type": "categorical", "role": "identifier", "enabled": false, "encoding": "one_hot" },
    { "name": "Jenis Kelamin :", "data_type": "categorical", "role": "feature", "enabled": true, "encoding": "one_hot" },
    { "name": "Tingkat Semester :", "data_type": "numeric", "role": "feature", "enabled": true },
    { "name": "Program Studi/Jurusan :", "data_type": "categorical", "role": "feature", "enabled": true, "encoding": "one_hot" },
    { "name": "Berapa lama Anda menggunakan Media Sosial dalam sehari?", "data_type": "categorical", "role": "feature", "enabled": true, "encoding": "one_hot" },
    { "name": "Berapa lama Anda tidur dalam sehari?", "data_type": "categorical", "role": "feature", "enabled": true, "encoding": "one_hot" },
    { "name": "Apakah Anda merasa prestasi akademik (IPK) Anda baik?", "data_type": "categorical", "role": "target", "enabled": true, "encoding": "one_hot" },
    { "name": "Apakah penggunaan Media Sosial dapat mempengaruhi prestasi akademik Anda?", "data_type": "categorical", "role": "feature", "enabled": true, "encoding": "one_hot" },
    { "name": "Platform Media Sosial apa yang paling sering Anda gunakan?", "data_type": "categorical", "role": "feature", "enabled": true, "encoding": "one_hot" },
    { "name": "Apakah penggunaan Media Sosial berpengaruh terhadap jam tidur Anda?", "data_type": "categorical", "role": "feature", "enabled": true, "encoding": "one_hot" }
  ],
  "split": {
    "method": "train_test",
    "test_size": 0.2,
    "stratify": true,
    "random_state": 42
  },
  "model": {
    "algorithm": "decision_tree_classifier",
    "criterion": "gini",
    "splitter": "best",
    "max_depth": 4,
    "min_samples_split": 2,
    "min_samples_leaf": 1,
    "random_state": 42
  }
}`

export const useWorkspaceStore = defineStore('workspace', () => {
  const apiBaseUrl = API_BASE_URL
  const isBootstrapping = ref(false)
  const isUploading = ref(false)
  const isTraining = ref(false)
  const errorMessage = ref('')
  const healthOk = ref(false)
  const healthStatuses = ref({
    live: false,
    ready: false,
    db: false,
  })

  const datasets = ref<any[]>([])
  const activeDataset = ref<any | null>(null)
  const datasetPreview = ref<any | null>(null)
  const datasetTable = ref<any | null>(null)
  const normalizedDatasetTable = ref<any | null>(null)
  const edaVisualization = ref<any | null>(null)
  const targetConversionPreview = ref<any | null>(null)
  const recommendedConfig = ref<any | null>(null)
  const runs = ref<any[]>([])
  const latestRun = ref<any | null>(null)
  const latestMetrics = ref<any | null>(null)
  const latestConfusionMatrixData = ref<any | null>(null)
  const latestFeatureImportanceData = ref<any | null>(null)
  const datasetTablePage = ref(1)
  const datasetTablePageSize = ref(8)
  const workflowVisualization = ref<any | null>(null)
  const preprocessingSummary = ref<any | null>(null)
  const configEditorText = ref(sampleConfigJson)

  const profileSummary = computed(() => activeDataset.value?.profile_json?.summary ?? null)
  const profileColumns = computed(() => activeDataset.value?.profile_json?.columns ?? [])
  const latestMetricsComputed = computed(() => latestMetrics.value?.metrics ?? latestMetrics.value ?? latestRun.value?.result_json?.metrics ?? null)
  const latestClassMetrics = computed(() => latestMetrics.value?.class_metrics ?? latestRun.value?.result_json?.class_metrics ?? [])
  const latestConfusionMatrix = computed(() => latestConfusionMatrixData.value ?? latestRun.value?.result_json?.confusion_matrix ?? null)
  const latestTree = computed(() => latestRun.value?.result_json?.tree_visualization ?? null)
  const latestImportance = computed(() =>
    latestFeatureImportanceData.value?.original_feature_importance ??
    latestRun.value?.result_json?.original_feature_importance ??
    latestFeatureImportanceData.value?.feature_importance ??
    latestRun.value?.result_json?.feature_importance ??
    latestFeatureImportanceData.value?.transformed_feature_importance ??
    latestRun.value?.result_json?.transformed_feature_importance ??
    [],
  )
  const processWorkflowSteps = computed(() => workflowVisualization.value?.steps ?? [])
  const datasetTablePagination = computed(() => datasetTable.value?.pagination ?? null)
  const normalizedDatasetTablePagination = computed(() => normalizedDatasetTable.value?.pagination ?? null)

  async function bootstrap() {
    isBootstrapping.value = true
    errorMessage.value = ''

    try {
      const healthResults = await Promise.allSettled([
        decisionTreeApi.getHealthLive(),
        decisionTreeApi.getHealthReady(),
        decisionTreeApi.getHealthDb(),
      ])

      healthStatuses.value = {
        live: healthResults[0].status === 'fulfilled',
        ready: healthResults[1].status === 'fulfilled',
        db: healthResults[2].status === 'fulfilled',
      }
      healthOk.value = Object.values(healthStatuses.value).every(Boolean)

      datasets.value = await decisionTreeApi.listDatasets()
      activeDataset.value = datasets.value[0] ?? null

      runs.value = await decisionTreeApi.listRuns()
      latestRun.value = runs.value[0] ?? null

      if (activeDataset.value?.id) {
        await hydrateDataset(activeDataset.value.id)
      }

      if (latestRun.value?.id) {
        await hydrateRun(latestRun.value.id)
      }
    } catch (error) {
      healthOk.value = false
      healthStatuses.value = {
        live: false,
        ready: false,
        db: false,
      }
      errorMessage.value = error instanceof Error ? error.message : 'Failed to load workspace'
    } finally {
      isBootstrapping.value = false
    }
  }

  async function hydrateDataset(datasetId: string) {
    const [profile, preview, originalTable, normalizedTable, eda, targetPreview, recommendation] =
      await Promise.all([
        decisionTreeApi.profileDataset(datasetId),
        decisionTreeApi.previewDataset(datasetId),
        decisionTreeApi.getDatasetTable(datasetId, { page: 1, pageSize: datasetTablePageSize.value }),
        decisionTreeApi.getDatasetTable(datasetId, { page: 1, pageSize: datasetTablePageSize.value, normalized: true }),
        decisionTreeApi.getEdaVisualization(datasetId),
        decisionTreeApi.getTargetConversionPreview(datasetId),
        decisionTreeApi.recommendConfig(datasetId),
      ])

    activeDataset.value = profile
    datasetPreview.value = preview
    datasetTable.value = originalTable
    normalizedDatasetTable.value = normalizedTable
    edaVisualization.value = eda
    targetConversionPreview.value = targetPreview
    recommendedConfig.value = recommendation
    configEditorText.value = JSON.stringify(recommendation, null, 2)
    datasetTablePage.value = 1
  }

  async function loadDatasetTablePage(datasetId: string, page: number, normalized = false) {
    const nextPage = Math.max(1, page)
    const table = await decisionTreeApi.getDatasetTable(datasetId, {
      page: nextPage,
      pageSize: datasetTablePageSize.value,
      normalized,
    })

    if (normalized) {
      normalizedDatasetTable.value = table
      return
    }

    datasetTable.value = table
    datasetTablePage.value = nextPage
  }

  async function hydrateRun(runId: string) {
    const [workflow, preprocessing, metrics, confusion, importance] = await Promise.all([
      decisionTreeApi.getWorkflowVisualization(runId),
      decisionTreeApi.getPreprocessingSummary(runId),
      decisionTreeApi.getRunMetrics(runId),
      decisionTreeApi.getRunConfusionMatrix(runId),
      decisionTreeApi.getRunFeatureImportance(runId),
    ])

    workflowVisualization.value = workflow
    preprocessingSummary.value = preprocessing
    latestMetrics.value = metrics
    latestConfusionMatrixData.value = confusion
    latestFeatureImportanceData.value = importance
  }

  async function uploadFile(file: File) {
    isUploading.value = true
    errorMessage.value = ''

    try {
      const uploaded = await decisionTreeApi.uploadDataset(file)
      datasets.value = [uploaded, ...datasets.value.filter((dataset) => dataset.id !== uploaded.id)]
      activeDataset.value = uploaded
      await hydrateDataset(uploaded.id)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Upload failed'
    } finally {
      isUploading.value = false
    }
  }

  async function trainUploadedFile(file: File) {
    isTraining.value = true
    errorMessage.value = ''

    try {
      const run = await decisionTreeApi.uploadAndTrain({
        file,
        runName: `Interactive run ${new Date().toISOString()}`,
        configJson: configEditorText.value,
      })
      latestRun.value = run
      runs.value = [run, ...runs.value.filter((item) => item.id !== run.id)]
      await hydrateRun(run.id)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Training failed'
    } finally {
      isTraining.value = false
    }
  }

  return {
    apiBaseUrl,
    isBootstrapping,
    isUploading,
    isTraining,
    errorMessage,
    healthOk,
    healthStatuses,
    datasets,
    activeDataset,
    datasetPreview,
    datasetTable,
    normalizedDatasetTable,
    datasetTablePage,
    datasetTablePageSize,
    datasetTablePagination,
    normalizedDatasetTablePagination,
    loadDatasetTablePage,
    edaVisualization,
    targetConversionPreview,
    recommendedConfig,
    runs,
    latestRun,
    workflowVisualization,
    preprocessingSummary,
    profileSummary,
    profileColumns,
    latestMetrics: latestMetricsComputed,
    latestClassMetrics,
    latestConfusionMatrix,
    latestTree,
    latestImportance,
    processWorkflowSteps,
    configEditorText,
    bootstrap,
    hydrateDataset,
    hydrateRun,
    uploadFile,
    trainUploadedFile,
  }
})
