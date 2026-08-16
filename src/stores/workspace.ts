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
  const manualSurveyProjectId = ref<string | null>(null)
  const manualSurveyResponses = ref<any[]>([])
  const manualSurveyTable = ref<any | null>(null)
  const manualSurveyPreview = ref<any | null>(null)
  const manualSurveyProfile = ref<any | null>(null)
  const manualSurveyEda = ref<any | null>(null)
  const manualSurveyConfig = ref<any | null>(null)
  const manualSurveyTargetPreview = ref<any | null>(null)
  const manualSurveySelectedResponseIds = ref<string[]>([])
  const manualSurveyRuns = ref<any[]>([])
  const manualSurveyActiveRun = ref<any | null>(null)
  const manualSurveyPreprocessingSummary = ref<any | null>(null)
  const manualSurveyMetrics = ref<any | null>(null)
  const manualSurveyConfusionMatrix = ref<any | null>(null)
  const manualSurveyTree = ref<any | null>(null)
  const manualSurveyFeatureImportance = ref<any | null>(null)
  const manualSurveyWorkflow = ref<any | null>(null)
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
  const latestMetricsComputed = computed(
    () =>
      latestMetrics.value?.metrics ??
      latestMetrics.value ??
      latestRun.value?.result_json?.metrics ??
      null,
  )
  const latestClassMetrics = computed(
    () => latestMetrics.value?.class_metrics ?? latestRun.value?.result_json?.class_metrics ?? [],
  )
  const latestConfusionMatrix = computed(
    () => latestConfusionMatrixData.value ?? latestRun.value?.result_json?.confusion_matrix ?? null,
  )
  const latestTree = computed(() => latestRun.value?.result_json?.tree_visualization ?? null)
  const latestImportance = computed(
    () =>
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
  const normalizedDatasetTablePagination = computed(
    () => normalizedDatasetTable.value?.pagination ?? null,
  )
  const hasReadyTrainingContext = computed(() =>
    Boolean(
      activeDataset.value &&
      selectedPreset.value &&
      !isLoadingPreset.value &&
      recommendedConfig.value,
    ),
  )
  const hasCachedUploadedFile = computed(() => lastUploadedFile.value != null)
  const lastUploadedFileName = computed(() => lastUploadedFile.value?.name ?? '')
  const hasManualSurveyAnalysis = computed(() =>
    Boolean(
      manualSurveyProfile.value ||
      manualSurveyEda.value ||
      manualSurveyConfig.value ||
      manualSurveyTargetPreview.value,
    ),
  )
  const manualSurveyMetricsSummary = computed(
    () => manualSurveyMetrics.value?.metrics ?? manualSurveyMetrics.value ?? null,
  )
  const manualSurveyClassMetrics = computed(() => manualSurveyMetrics.value?.class_metrics ?? [])
  const manualSurveyWorkflowSteps = computed(() => manualSurveyWorkflow.value?.steps ?? [])
  const manualSurveyTreeNodes = computed(() => manualSurveyTree.value?.nodes ?? [])
  const manualSurveyTreeEdges = computed(() => manualSurveyTree.value?.edges ?? [])

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
    const [profile, preview, originalTable, normalizedTable, eda] = await Promise.all([
      decisionTreeApi.profileDataset(datasetId),
      decisionTreeApi.previewDataset(datasetId),
      decisionTreeApi.getDatasetTable(datasetId, { page: 1, pageSize: datasetTablePageSize.value }),
      decisionTreeApi.getDatasetTable(datasetId, {
        page: 1,
        pageSize: datasetTablePageSize.value,
        normalized: true,
      }),
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
        throw new Error(
          'Belum ada file untuk training. Upload file dulu, lalu klik Upload + Profile.',
        )
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

      if (
        lowered.includes('http 422') ||
        lowered.includes('preset harus') ||
        lowered.includes('preset wajib')
      ) {
        errorMessage.value =
          'Backend mewajibkan preset dipilih. Pilih salah satu preset lalu lanjutkan.'
      } else if (lowered.includes('dataset tidak cocok')) {
        errorMessage.value =
          'Dataset tidak cocok untuk preset ini. Silakan pilih preset lain atau ganti file.'
      } else {
        errorMessage.value = message
      }
      throw error
    } finally {
      isLoadingPreset.value = false
    }
  }

  function resetManualSurveyAnalysis() {
    manualSurveyProfile.value = null
    manualSurveyEda.value = null
    manualSurveyConfig.value = null
    manualSurveyTargetPreview.value = null
    manualSurveyTable.value = null
    manualSurveyPreview.value = null
    manualSurveyPreprocessingSummary.value = null
    manualSurveyMetrics.value = null
    manualSurveyConfusionMatrix.value = null
    manualSurveyTree.value = null
    manualSurveyFeatureImportance.value = null
    manualSurveyWorkflow.value = null
  }

  async function loadManualSurveyResponses(projectId: string | null = manualSurveyProjectId.value) {
    manualSurveyProjectId.value = projectId

    if (!projectId) {
      manualSurveyResponses.value = []
      manualSurveySelectedResponseIds.value = []
      manualSurveyRuns.value = []
      manualSurveyActiveRun.value = null
      return
    }

    const [responses, runs] = await Promise.all([
      decisionTreeApi.listManualSurveyResponses(projectId),
      decisionTreeApi.listManualSurveyTrainingRuns(projectId),
    ])

    manualSurveyResponses.value = Array.isArray(responses) ? responses : []
    manualSurveyRuns.value = Array.isArray(runs) ? runs : []
  }

  async function refreshManualSurveyAnalysis(
    projectId: string | null = manualSurveyProjectId.value,
  ) {
    manualSurveyProjectId.value = projectId

    if (!projectId) {
      resetManualSurveyAnalysis()
      manualSurveySelectedResponseIds.value = []
      manualSurveyRuns.value = []
      manualSurveyActiveRun.value = null
      return
    }

    try {
      const [table, preview, profile, eda, config, targetPreview] = await Promise.all([
        decisionTreeApi.getManualSurveyDatasetTable(projectId, 1, 20),
        decisionTreeApi.getManualSurveyDatasetPreview(projectId, 20),
        decisionTreeApi.profileManualSurveyDataset(projectId),
        decisionTreeApi.getManualSurveyEdaVisualization(projectId),
        decisionTreeApi.recommendManualSurveyConfig(projectId),
        decisionTreeApi.getManualSurveyTargetConversionPreview(projectId),
      ])

      manualSurveyTable.value = table
      manualSurveyPreview.value = preview
      manualSurveyProfile.value = profile
      manualSurveyEda.value = eda
      manualSurveyConfig.value = config
      manualSurveyTargetPreview.value = targetPreview
      manualSurveySelectedResponseIds.value = []

      const runs = await decisionTreeApi.listManualSurveyTrainingRuns(projectId)
      manualSurveyRuns.value = Array.isArray(runs) ? runs : []
    } catch (error) {
      resetManualSurveyAnalysis()
      throw error
    }
  }

  async function createManualSurveyResponse(payload: Record<string, unknown>) {
    const projectId =
      typeof payload.project_id === 'string' ? payload.project_id : manualSurveyProjectId.value
    await decisionTreeApi.createManualSurveyResponse(payload)
    await loadManualSurveyResponses(projectId)
    await refreshManualSurveyAnalysis(projectId)
  }

  async function bulkCreateManualSurveyResponses(payload: {
    project_id?: string | null
    responses: Record<string, unknown>[]
  }) {
    const projectId = payload.project_id ?? manualSurveyProjectId.value
    await decisionTreeApi.bulkCreateManualSurveyResponses(payload)
    await loadManualSurveyResponses(projectId)
    await refreshManualSurveyAnalysis(projectId)
  }

  async function updateManualSurveyResponse(responseId: string, payload: Record<string, unknown>) {
    await decisionTreeApi.updateManualSurveyResponse(responseId, payload)
    await loadManualSurveyResponses(manualSurveyProjectId.value)
    await refreshManualSurveyAnalysis(manualSurveyProjectId.value)
  }

  async function deleteManualSurveyResponse(responseId: string) {
    await decisionTreeApi.deleteManualSurveyResponse(responseId)
    manualSurveySelectedResponseIds.value = manualSurveySelectedResponseIds.value.filter(
      (id) => id !== responseId,
    )
    await loadManualSurveyResponses(manualSurveyProjectId.value)
    await refreshManualSurveyAnalysis(manualSurveyProjectId.value)
  }

  async function hydrateManualSurveyRun(runId: string) {
    const [runDetail, preprocessing, metrics, confusion, featureImportance, tree, workflow] =
      await Promise.all([
        decisionTreeApi.getManualSurveyTrainingRun(runId),
        decisionTreeApi.getManualSurveyTrainingRunPreprocessingSummary(runId),
        decisionTreeApi.getManualSurveyTrainingRunMetrics(runId),
        decisionTreeApi.getManualSurveyTrainingRunConfusionMatrix(runId),
        decisionTreeApi.getManualSurveyTrainingRunFeatureImportance(runId),
        decisionTreeApi.getManualSurveyTrainingRunTreeVisualization(runId),
        decisionTreeApi.getManualSurveyTrainingRunWorkflow(runId),
      ])

    manualSurveyActiveRun.value = runDetail
    manualSurveyPreprocessingSummary.value = preprocessing
    manualSurveyMetrics.value = metrics
    manualSurveyConfusionMatrix.value = confusion
    manualSurveyFeatureImportance.value = featureImportance
    manualSurveyTree.value = tree
    manualSurveyWorkflow.value = workflow
    return runDetail
  }

  async function loadManualSurveyRunDetail(runId: string) {
    if (!runId) return null
    return hydrateManualSurveyRun(runId)
  }

  async function trainManualSurveyRun(payload: {
    run_name: string
    project_id?: string | null
    response_ids?: string[]
    config?: Record<string, unknown> | null
  }) {
    const run = await decisionTreeApi.createManualSurveyTrainingRun({
      ...payload,
      project_id: payload.project_id ?? manualSurveyProjectId.value,
      response_ids: payload.response_ids ?? manualSurveySelectedResponseIds.value,
      config: payload.config ?? manualSurveyConfig.value,
    })

    manualSurveyActiveRun.value = run
    manualSurveyRuns.value = [run, ...manualSurveyRuns.value.filter((item) => item.id !== run.id)]
    await hydrateManualSurveyRun(run.id)
    return run
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
    manualSurveyProjectId,
    manualSurveyResponses,
    manualSurveyTable,
    manualSurveyPreview,
    manualSurveyProfile,
    manualSurveyEda,
    manualSurveyConfig,
    manualSurveyTargetPreview,
    manualSurveySelectedResponseIds,
    manualSurveyRuns,
    manualSurveyActiveRun,
    manualSurveyPreprocessingSummary,
    manualSurveyMetrics,
    manualSurveyMetricsSummary,
    manualSurveyClassMetrics,
    manualSurveyConfusionMatrix,
    manualSurveyTree,
    manualSurveyTreeNodes,
    manualSurveyTreeEdges,
    manualSurveyFeatureImportance,
    manualSurveyWorkflow,
    manualSurveyWorkflowSteps,
    hasManualSurveyAnalysis,
    selectDatasetPreset,
    bootstrap,
    hydrateDataset,
    hydrateRun,
    uploadFile,
    trainUploadedFile,
    loadManualSurveyResponses,
    refreshManualSurveyAnalysis,
    createManualSurveyResponse,
    bulkCreateManualSurveyResponses,
    updateManualSurveyResponse,
    deleteManualSurveyResponse,
    trainManualSurveyRun,
    loadManualSurveyRunDetail,
    resetManualSurveyAnalysis,
  }
})
