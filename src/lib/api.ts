const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

type ApiEnvelope<T> = {
  success: boolean
  data: T
  meta?: {
    request_id?: string
    timestamp?: string
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init)

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    const rawBody = await response.text()
    let message = rawBody

    try {
      const parsed = JSON.parse(rawBody)
      if (typeof parsed?.detail === 'string') {
        message = parsed.detail
      } else if (typeof parsed?.message === 'string') {
        message = parsed.message
      } else if (Array.isArray(parsed?.detail) && parsed.detail[0]?.msg) {
        message = parsed.detail.map((row: any) => row.msg).join(', ')
      }
    } catch {
      // keep raw body
    }

    throw new Error(`HTTP ${response.status}: ${message || 'Request failed'}`)
  }

  const rawText = await response.text()
  if (!rawText) {
    return undefined as T
  }

  try {
    const parsed = JSON.parse(rawText) as ApiEnvelope<T> | T
    if (parsed && typeof parsed === 'object' && 'success' in parsed && 'data' in parsed) {
      return (parsed as ApiEnvelope<T>).data
    }

    return parsed as T
  } catch {
    return rawText as unknown as T
  }
}

function withProjectParam(path: string, projectId?: string | null) {
  if (!projectId) return path

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}project_id=${encodeURIComponent(projectId)}`
}

export const decisionTreeApi = {
  getHealthLive() {
    return request<Record<string, never>>('/api/v1/health/live')
  },
  getHealthReady() {
    return request<Record<string, never>>('/api/v1/health/ready')
  },
  getHealthDb() {
    return request<Record<string, never>>('/api/v1/health/db')
  },
  listDatasets() {
    return request<any[]>('/api/v1/datasets')
  },
  listConfigurationPresets() {
    return request<{ id: string; label: string; description: string }[]>(
      '/api/v1/datasets/configuration-presets',
    )
  },
  profileDataset(datasetId: string) {
    return request<any>(`/api/v1/datasets/${datasetId}/profile`, {
      method: 'POST',
    })
  },
  getEdaVisualization(datasetId: string) {
    return request<any>(`/api/v1/datasets/${datasetId}/eda-visualization`)
  },
  getTargetConversionPreview(datasetId: string, preset: string) {
    const query = new URLSearchParams({ preset }).toString()

    return request<any>(`/api/v1/datasets/${datasetId}/target-conversion-preview?${query}`)
  },
  recommendConfig(datasetId: string, preset: string) {
    const query = new URLSearchParams({ preset }).toString()

    return request<any>(`/api/v1/datasets/${datasetId}/recommend-config?${query}`, {
      method: 'POST',
    })
  },
  getDatasetTable(
    datasetId: string,
    options?: { page?: number; pageSize?: number; normalized?: boolean },
  ) {
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 5
    const normalized = options?.normalized ? '&normalized=true' : ''

    return request<any>(
      `/api/v1/datasets/${datasetId}/table?page=${page}&page_size=${pageSize}${normalized}`,
    )
  },
  previewDataset(datasetId: string, limit = 5) {
    return request<any>(`/api/v1/datasets/${datasetId}/preview?limit=${limit}`)
  },
  listRuns() {
    return request<any[]>('/api/v1/experiments/runs')
  },
  getRunMetrics(runId: string) {
    return request<any>(`/api/v1/experiments/runs/${runId}/metrics`)
  },
  getRunConfusionMatrix(runId: string) {
    return request<any>(`/api/v1/experiments/runs/${runId}/confusion-matrix`)
  },
  getRunFeatureImportance(runId: string) {
    return request<any>(`/api/v1/experiments/runs/${runId}/feature-importance`)
  },
  getWorkflowVisualization(runId: string) {
    return request<any>(`/api/v1/experiments/runs/${runId}/workflow-visualization`)
  },
  getPreprocessingSummary(runId: string) {
    return request<any>(`/api/v1/experiments/runs/${runId}/preprocessing-summary`)
  },
  uploadDataset(file: File) {
    const formData = new FormData()
    formData.set('file', file)

    return request<any>('/api/v1/datasets/upload', {
      method: 'POST',
      body: formData,
    })
  },
  uploadAndTrain(params: { file: File; runName: string; configJson: string }) {
    const formData = new FormData()
    formData.set('file', params.file)
    formData.set('run_name', params.runName)
    formData.set('config_json', params.configJson)

    return request<any>('/api/v1/experiments/runs/upload-train', {
      method: 'POST',
      body: formData,
    })
  },

  listManualSurveyResponses(projectId?: string | null) {
    return request<any[]>(withProjectParam('/api/v1/manual-survey/responses', projectId))
  },
  createManualSurveyResponse(payload: Record<string, unknown>) {
    return request<any>('/api/v1/manual-survey/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  },
  bulkCreateManualSurveyResponses(payload: {
    project_id?: string | null
    responses: Record<string, unknown>[]
  }) {
    return request<any>('/api/v1/manual-survey/responses/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  },
  getManualSurveyResponse(responseId: string) {
    return request<any>(`/api/v1/manual-survey/responses/${responseId}`)
  },
  updateManualSurveyResponse(responseId: string, payload: Record<string, unknown>) {
    return request<any>(`/api/v1/manual-survey/responses/${responseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  },
  deleteManualSurveyResponse(responseId: string) {
    return request<void>(`/api/v1/manual-survey/responses/${responseId}`, {
      method: 'DELETE',
    })
  },
  getManualSurveyDatasetTable(projectId?: string | null, page = 1, pageSize = 50) {
    const base = `/api/v1/manual-survey/dataset/table?page=${page}&page_size=${pageSize}`
    return request<any>(withProjectParam(base, projectId))
  },
  getManualSurveyDatasetPreview(projectId?: string | null, limit = 20) {
    const base = `/api/v1/manual-survey/dataset/preview?limit=${limit}`
    return request<any>(withProjectParam(base, projectId))
  },
  profileManualSurveyDataset(projectId?: string | null) {
    const base = '/api/v1/manual-survey/dataset/profile'
    return request<any>(withProjectParam(base, projectId), { method: 'POST' })
  },
  getManualSurveyEdaVisualization(projectId?: string | null) {
    return request<any>(
      withProjectParam('/api/v1/manual-survey/dataset/eda-visualization', projectId),
    )
  },
  recommendManualSurveyConfig(projectId?: string | null) {
    const base = '/api/v1/manual-survey/dataset/recommend-config'
    return request<any>(withProjectParam(base, projectId), { method: 'POST' })
  },
  getManualSurveyTargetConversionPreview(projectId?: string | null) {
    return request<any>(
      withProjectParam('/api/v1/manual-survey/dataset/target-conversion-preview', projectId),
    )
  },
  listManualSurveyTrainingRuns(projectId?: string | null) {
    const base = '/api/v1/manual-survey/training/runs'
    return request<any[]>(withProjectParam(base, projectId))
  },
  getManualSurveyTrainingRun(runId: string) {
    return request<any>(`/api/v1/manual-survey/training/runs/${runId}`)
  },
  getManualSurveyTrainingRunPreprocessingSummary(runId: string) {
    return request<any>(`/api/v1/manual-survey/training/runs/${runId}/preprocessing-summary`)
  },
  getManualSurveyTrainingRunMetrics(runId: string) {
    return request<any>(`/api/v1/manual-survey/training/runs/${runId}/metrics`)
  },
  getManualSurveyTrainingRunConfusionMatrix(runId: string) {
    return request<any>(`/api/v1/manual-survey/training/runs/${runId}/confusion-matrix`)
  },
  getManualSurveyTrainingRunFeatureImportance(runId: string) {
    return request<any>(`/api/v1/manual-survey/training/runs/${runId}/feature-importance`)
  },
  getManualSurveyTrainingRunTreeVisualization(runId: string) {
    return request<any>(`/api/v1/manual-survey/training/runs/${runId}/tree-visualization`)
  },
  getManualSurveyTrainingRunWorkflow(runId: string) {
    return request<any>(`/api/v1/manual-survey/training/runs/${runId}/workflow-visualization`)
  },
  createManualSurveyTrainingRun(payload: {
    run_name: string
    project_id?: string | null
    response_ids?: string[]
    config?: Record<string, unknown> | null
  }) {
    return request<any>('/api/v1/manual-survey/training/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  },
}

export { API_BASE_URL }
