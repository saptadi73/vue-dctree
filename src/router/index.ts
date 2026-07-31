import { createRouter, createWebHistory } from 'vue-router'
import ApiAtlasView from '../views/ApiAtlasView.vue'
import ConfigStudioView from '../views/ConfigStudioView.vue'
import EdaView from '../views/EdaView.vue'
import EvaluationLabView from '../views/EvaluationLabView.vue'
import OverviewView from '../views/OverviewView.vue'
import PipelineView from '../views/PipelineView.vue'
import TreeExplorerView from '../views/TreeExplorerView.vue'
import WorkflowDetailView from '../views/WorkflowDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'overview',
      component: OverviewView,
    },
    {
      path: '/pipeline',
      name: 'pipeline',
      component: PipelineView,
    },
    {
      path: '/eda',
      name: 'eda',
      component: EdaView,
    },
    {
      path: '/config-studio',
      name: 'config-studio',
      component: ConfigStudioView,
    },
    {
      path: '/tree-explorer',
      name: 'tree-explorer',
      component: TreeExplorerView,
    },
    {
      path: '/evaluation-lab',
      name: 'evaluation-lab',
      component: EvaluationLabView,
    },
    {
      path: '/api-atlas',
      name: 'api-atlas',
      component: ApiAtlasView,
    },
    {
      path: '/workflow-detail',
      name: 'workflow-detail',
      component: WorkflowDetailView,
    },
  ],
})

export default router
