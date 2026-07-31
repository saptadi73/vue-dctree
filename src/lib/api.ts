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
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
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
  profileDataset(datasetId: string) {
    return request<any>(`/api/v1/datasets/${datasetId}/profile`, {
      method: 'POST',
    })
  },
  recommendConfig(datasetId: string) {
    return request<any>(`/api/v1/datasets/${datasetId}/recommend-config`, {
      method: 'POST',
    })
  },
  previewDataset(datasetId: string, limit = 5) {
    return request<any>(`/api/v1/datasets/${datasetId}/preview?limit=${limit}`)
  },
  listRuns() {
    return request<any[]>('/api/v1/experiments/runs')
  },
  getWorkflowVisualization(runId: string) {
    return request<any>(`/api/v1/experiments/runs/${runId}/workflow-visualization`)
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
