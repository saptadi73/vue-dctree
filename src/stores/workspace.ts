import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { API_BASE_URL, decisionTreeApi } from '../lib/api'

const emptyConfigJson = '{}'

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
  const configurationPresets = ref<Array<{ id: string; label: string; description: string }>>([])
  const selectedPreset = ref<string>('')
  const runs = ref<any[]>([])
  const latestRun = ref<any | null>(null)
  const latestMetrics = ref<any | null>(null)
  const latestConfusionMatrixData = ref<any | null>(null)
  const latestFeatureImportanceData = ref<any | null>(null)
  const datasetTablePage = ref(1)
  const datasetTablePageSize = ref(8)
  const workflowVisualization = ref<any | null>(null)
  const preprocessingSummary = ref<any | null>(null)
  const configEditorText = ref(emptyConfigJson)
  const isLoadingPreset = ref(false)
  const lastUploadedFile = ref<File | null>(null)

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
  const hasReadyTrainingContext = computed(() =>
    Boolean(activeDataset.value && selectedPreset.value && !isLoadingPreset.value && recommendedConfig.value),
  )
  const hasCachedUploadedFile = computed(() => lastUploadedFile.value != null)
  const lastUploadedFileName = computed(() => lastUploadedFile.value?.name ?? '')

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
      configurationPresets.value = await decisionTreeApi.listConfigurationPresets()
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
    const [profile, preview, originalTable, normalizedTable, eda] =
      await Promise.all([
        decisionTreeApi.profileDataset(datasetId),
        decisionTreeApi.previewDataset(datasetId),
        decisionTreeApi.getDatasetTable(datasetId, { page: 1, pageSize: datasetTablePageSize.value }),
        decisionTreeApi.getDatasetTable(datasetId, { page: 1, pageSize: datasetTablePageSize.value, normalized: true }),
        decisionTreeApi.getEdaVisualization(datasetId),
      ])

    activeDataset.value = profile
    datasetPreview.value = preview
    datasetTable.value = originalTable
    normalizedDatasetTable.value = normalizedTable
    edaVisualization.value = eda
    targetConversionPreview.value = null
    recommendedConfig.value = null
    configEditorText.value = emptyConfigJson
    datasetTablePage.value = 1
    selectedPreset.value = ''
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
      lastUploadedFile.value = file
      await hydrateDataset(uploaded.id)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Upload failed'
    } finally {
      isUploading.value = false
    }
  }

  function getTrainingErrorMessage(rawMessage: string): string {
    const lowered = rawMessage.toLowerCase()
    if (lowered.includes('http 422') || lowered.includes('preset wajib')) {
      return 'Pilih preset dataset terlebih dulu sebelum training.'
    }

    if (lowered.includes('dataset tidak cocok')) {
      return 'Dataset tidak cocok dengan preset terpilih. Silakan ganti file atau pilih preset lain.'
    }

    return rawMessage
  }

  async function trainUploadedFile(file?: File) {
    isTraining.value = true
    errorMessage.value = ''
    const trainFile = file ?? lastUploadedFile.value

    try {
      if (!trainFile) {
        throw new Error('Belum ada file untuk training. Upload file dulu, lalu klik Upload + Profile.')
      }

      if (!selectedPreset.value) {
        throw new Error('HTTP 422: Preset wajib dipilih dari daftar preset sebelum training.')
      }
      if (!recommendedConfig.value) {
        throw new Error('Rekomendasi konfigurasi belum siap. Muat ulang preset pilihan Anda.')
      }

      const run = await decisionTreeApi.uploadAndTrain({
        file: trainFile,
        runName: `Interactive run ${new Date().toISOString()}`,
        configJson: configEditorText.value,
      })
      latestRun.value = run
      runs.value = [run, ...runs.value.filter((item) => item.id !== run.id)]
      await hydrateRun(run.id)
    } catch (error) {
      if (error instanceof Error) {
        errorMessage.value = getTrainingErrorMessage(error.message)
      } else {
        errorMessage.value = 'Training failed'
      }
    } finally {
      isTraining.value = false
    }
  }

  async function selectDatasetPreset(presetId: string) {
    if (!activeDataset.value?.id) {
      throw new Error('Upload dataset terlebih dulu sebelum memilih preset.')
    }

    if (!configurationPresets.value.some((preset) => preset.id === presetId)) {
      throw new Error('Preset tidak dikenal.')
    }

    selectedPreset.value = presetId
    isLoadingPreset.value = true
    errorMessage.value = ''

    try {
      const [config, preview] = await Promise.all([
        decisionTreeApi.recommendConfig(activeDataset.value.id, presetId),
        decisionTreeApi.getTargetConversionPreview(activeDataset.value.id, presetId),
      ])

      recommendedConfig.value = config
      targetConversionPreview.value = preview
      configEditorText.value = JSON.stringify(config, null, 2)
    } catch (error) {
      recommendedConfig.value = null
      targetConversionPreview.value = null
      configEditorText.value = emptyConfigJson
      const message = error instanceof Error ? error.message : 'Gagal memuat konfigurasi preset.'
      const lowered = message.toLowerCase()

      if (lowered.includes('http 422') || lowered.includes('preset harus') || lowered.includes('preset wajib')) {
        errorMessage.value = 'Backend mewajibkan preset dipilih. Pilih salah satu preset lalu lanjutkan.'
      } else if (lowered.includes('dataset tidak cocok')) {
        errorMessage.value = 'Dataset tidak cocok untuk preset ini. Silakan pilih preset lain atau ganti file.'
      } else {
        errorMessage.value = message
      }
      throw error
    } finally {
      isLoadingPreset.value = false
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
  configurationPresets,
  selectedPreset,
  isLoadingPreset,
  hasReadyTrainingContext,
  hasCachedUploadedFile,
  lastUploadedFileName,
  selectDatasetPreset,
  bootstrap,
    hydrateDataset,
    hydrateRun,
    uploadFile,
    trainUploadedFile,
  }
})
