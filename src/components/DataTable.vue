<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Search } from '@lucide/vue'

export type DataTableColumn = {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  formatter?: (value: unknown, row: Record<string, unknown>) => string
}

const props = withDefaults(
  defineProps<{
    columns: DataTableColumn[]
    rows: Record<string, unknown>[]
    searchPlaceholder?: string
    emptyMessage?: string
    pageSize?: number
  }>(),
  {
    searchPlaceholder: 'Cari data...',
    emptyMessage: 'Tidak ada data untuk ditampilkan.',
    pageSize: 8,
  },
)

const search = ref('')
const currentPage = ref(1)

const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return props.rows

  return props.rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(query),
    ),
  )
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredRows.value.length / props.pageSize)),
)

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return filteredRows.value.slice(start, start + props.pageSize)
})

const pageNumbers = computed(() =>
  Array.from({ length: totalPages.value }, (_, index) => index + 1),
)

watch(search, () => {
  currentPage.value = 1
})

watch(
  () => props.rows,
  () => {
    currentPage.value = 1
  },
)

function formatCellValue(column: DataTableColumn, row: Record<string, unknown>) {
  if (column.formatter) return column.formatter(row[column.key], row)
  const value = row[column.key]
  return value == null ? '—' : String(value)
}

function changePage(page: number) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}
</script>

<template>
  <div class="data-table">
    <div v-if="rows.length || search" class="data-table__toolbar">
      <label class="data-table__search">
        <Search class="h-4 w-4" />
        <input v-model="search" type="search" :placeholder="searchPlaceholder" />
      </label>
    </div>

    <div class="data-table__wrap">
      <table class="data-table__table">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="`text-${column.align ?? 'left'}`"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!paginatedRows.length">
            <td :colspan="columns.length" class="data-table__empty">{{ emptyMessage }}</td>
          </tr>
          <tr
            v-for="row in paginatedRows"
            :key="String(row.id ?? JSON.stringify(row))"
            class="data-table__row"
          >
            <td
              v-for="column in columns"
              :key="`${String(row.id ?? JSON.stringify(row))}-${column.key}`"
              :class="`text-${column.align ?? 'left'}`"
            >
              <slot
                v-if="column.key === 'actions'"
                name="cell-actions"
                :row="row"
                :column="column"
              />
              <template v-else>
                {{ formatCellValue(column, row) }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="filteredRows.length > pageSize" class="data-table__footer">
      <button
        type="button"
        class="data-table__pager"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>

      <button
        v-for="page in pageNumbers"
        :key="page"
        type="button"
        class="data-table__page"
        :class="{ 'is-active': page === currentPage }"
        @click="changePage(page)"
      >
        {{ page }}
      </button>

      <button
        type="button"
        class="data-table__pager"
        :disabled="currentPage >= totalPages"
        @click="changePage(currentPage + 1)"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
