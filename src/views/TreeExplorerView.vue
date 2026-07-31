<script setup lang="ts">
import { computed, onMounted } from 'vue'
import SectionCard from '../components/SectionCard.vue'
import { ruleCards, treeNodes } from '../data/decisionTreeDemo'
import { useWorkspaceStore } from '../stores/workspace'

const workspace = useWorkspaceStore()

onMounted(() => {
  if (!workspace.latestRun && !workspace.isBootstrapping) {
    workspace.bootstrap()
  }
})

const liveTreeNodes = computed(() => {
  const nodes = workspace.latestTree?.nodes

  if (!nodes?.length) {
    return treeNodes
  }

  return nodes.slice(0, 6).map((node: any, index: number) => ({
    id: node.node_id,
    depth: node.depth,
    title: node.is_leaf ? 'Leaf Node' : index === 0 ? 'Root Node' : `Branch ${node.node_id}`,
    condition: node.is_leaf
      ? 'Leaf prediction node'
      : `${node.feature_name} ${node.operator} ${node.threshold}`,
    predictedClass: node.predicted_class,
    samples: node.samples,
    impurity: Number(node.impurity?.toFixed?.(4) ?? node.impurity ?? 0),
    confidence: `${node.predicted_class} class`,
    accent: ['from-cyan-400/30 to-cyan-500/5', 'from-orange-400/30 to-orange-500/5', 'from-emerald-400/30 to-emerald-500/5', 'from-fuchsia-400/30 to-fuchsia-500/5'][index % 4],
  }))
})

const liveRuleCards = computed(() => {
  const rawRules = workspace.latestRun?.result_json?.tree_rules_text

  if (!rawRules) {
    return ruleCards
  }

  const segments = rawRules
    .split('|---')
    .map((entry: string) => entry.trim())
    .filter(Boolean)
    .slice(0, 3)

  return segments.map((segment: string, index: number) => ({
    title: `Rule ${String(index + 1).padStart(2, '0')}`,
    prediction: segment.includes('class:')
      ? (segment.split('class:')[1] ?? 'Derived from tree path').trim()
      : 'Derived from tree path',
    support: 'Extracted from backend tree_rules_text',
    conditions: segment.split('\n').map((line) => line.trim()).filter(Boolean),
  }))
})
</script>

<template>
  <div class="space-y-6">
    <SectionCard
      eyebrow="Tree Anatomy"
      title="Struktur node untuk visualisasi interaktif"
      description="Dokumen backend mengirim node tree yang dinormalisasi. View ini menampilkan bagaimana informasi `condition`, `impurity`, `samples`, dan `predicted_class` bisa dipresentasikan secara visual."
    >
      <div class="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div class="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,16,30,0.95),rgba(14,25,45,0.92))] p-6">
          <div class="grid gap-5 md:grid-cols-2">
            <article
              v-for="node in liveTreeNodes"
              :key="node.id"
              class="rounded-[1.7rem] border border-white/10 p-5"
              :class="`bg-gradient-to-br ${node.accent}`"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs uppercase tracking-[0.24em] text-slate-300">Node {{ node.id }} · Depth {{ node.depth }}</p>
                  <h3 class="mt-2 font-heading text-2xl font-semibold text-white">{{ node.title }}</h3>
                </div>
                <span class="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-xs font-semibold text-white">
                  {{ node.predictedClass }}
                </span>
              </div>
              <p class="mt-4 text-sm leading-6 text-slate-200">{{ node.condition }}</p>
              <div class="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div class="rounded-2xl bg-black/20 p-3">
                  <p class="text-slate-300">Samples</p>
                  <p class="mt-1 font-heading text-xl text-white">{{ node.samples }}</p>
                </div>
                <div class="rounded-2xl bg-black/20 p-3">
                  <p class="text-slate-300">Impurity</p>
                  <p class="mt-1 font-heading text-xl text-white">{{ node.impurity }}</p>
                </div>
                <div class="rounded-2xl bg-black/20 p-3">
                  <p class="text-slate-300">Confidence</p>
                  <p class="mt-1 font-heading text-xl text-white">{{ node.confidence }}</p>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div class="space-y-4">
          <div class="rounded-[1.8rem] border border-white/10 bg-black/20 p-5">
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Translator Layer</p>
            <h3 class="mt-3 font-heading text-2xl font-semibold text-white">Human-readable rules</h3>
            <p class="mt-3 text-sm leading-6 text-slate-300">
              Kondisi one-hot yang teknis sebaiknya diterjemahkan di service layer menjadi kalimat yang lebih mudah dibaca pengguna non-teknis.
            </p>
          </div>
          <div class="rounded-[1.8rem] border border-white/10 bg-black/20 p-5">
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Node Contract</p>
            <p class="mt-3 text-sm leading-6 text-slate-300">
              `node_id`, `parent_node_id`, `depth`, `operator`, `threshold`, `class_counts`, dan `left/right child` cukup untuk membangun tree explorer berbasis SVG, canvas, atau DOM biasa.
            </p>
          </div>
        </div>
      </div>
    </SectionCard>

    <SectionCard
      eyebrow="Decision Rules"
      title="Root-to-leaf cards untuk interpretasi cepat"
      description="Rules membantu reviewer memahami perilaku model tanpa harus menelusuri semua node satu per satu."
    >
      <div class="grid gap-4 lg:grid-cols-3">
        <article
          v-for="rule in liveRuleCards"
          :key="rule.title"
          class="rounded-[1.7rem] border border-white/10 bg-black/20 p-5"
        >
          <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">{{ rule.title }}</p>
          <h3 class="mt-3 font-heading text-2xl font-semibold">{{ rule.prediction }}</h3>
          <p class="mt-2 text-sm text-slate-300">{{ rule.support }}</p>
          <ul class="mt-4 space-y-2 text-sm leading-6 text-slate-200">
            <li v-for="condition in rule.conditions" :key="condition">{{ condition }}</li>
          </ul>
        </article>
      </div>
    </SectionCard>
  </div>
</template>
