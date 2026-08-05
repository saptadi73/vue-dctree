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

  const json = (await response.json()) as ApiEnvelope<T>
  return json.data
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
    return request<{ id: string; label: string; description: string }[]>('/api/v1/datasets/configuration-presets')
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
  getDatasetTable(datasetId: string, options?: { page?: number; pageSize?: number; normalized?: boolean }) {
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
}

export { API_BASE_URL }
