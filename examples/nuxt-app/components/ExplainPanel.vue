<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { codeToHtml } from 'shiki'

export type SectionId = 'home-page' | 'recipes-handler' | 'create-handler' | 'favorites-store'
type Group = 'pages' | 'api' | 'state'

const GROUP_LABELS: Record<Group, { label: string; modifier: string }> = {
  pages: { label: 'Pages', modifier: 'explain-panel__chip--pages' },
  api:   { label: 'API',   modifier: 'explain-panel__chip--api' },
  state: { label: 'State', modifier: 'explain-panel__chip--state' },
}

type Section = {
  id: SectionId
  icon: string
  title: string
  module: string
  group: Group
  language: string
  code: string
  annotations: Record<number, string>
  summary?: string
}

const CODE_HOME_PAGE = `<script setup lang="ts">
const { data: recipes, pending, error } = await useFetch('/api/recipes')
<\/script>

<template>
  <div>
    <h1>Recipes</h1>
    <p v-if="pending">Loading…</p>
    <p v-else-if="error">{{ error.message }}</p>
    <ul v-else>
      <li v-for="r in recipes" :key="r.id">{{ r.title }}</li>
    </ul>
  </div>
</template>`
const ANNOT_HOME_PAGE: Record<number, string> = {
  2: 'useFetch dedupes the call between SSR and client hydration — no double-fetch.',
  9: 'pending and error refs come straight from the composable — no manual loading state.',
  12: 'No need to wrap in Suspense — Nuxt handles it at the page level.',
}

const CODE_RECIPES_HANDLER = `export default defineEventHandler(async (event) => {
  const { tag } = getQuery(event)
  const storage = useStorage('kv')
  const all = (await storage.getItem<Recipe[]>('recipes')) ?? []
  const filtered = tag
    ? all.filter((r) => r.tags.includes(String(tag)))
    : all
  return {
    recipes: filtered,
    total: filtered.length,
  }
})`
const ANNOT_RECIPES_HANDLER: Record<number, string> = {
  1: "defineEventHandler — Nitro's universal handler signature.",
  2: 'getQuery — typed access to URL params, no parsing boilerplate.',
  3: "useStorage('kv') — driver-agnostic KV; backed by Cloudflare KV in production.",
}

const CODE_CREATE_HANDLER = `import { object, string } from 'valibot'

const RecipeInput = object({
  title: string(),
  body: string(),
})

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, (b) =>
    parse(RecipeInput, b),
  )
  const recipe = { id: crypto.randomUUID(), ...input, createdAt: Date.now() }
  const storage = useStorage('kv')
  const all = (await storage.getItem<Recipe[]>('recipes')) ?? []
  all.push(recipe)
  await storage.setItem('recipes', all)
  broadcast('recipe:created', recipe)
  return recipe
})`
const ANNOT_CREATE_HANDLER: Record<number, string> = {
  9: 'readValidatedBody combines body reading with Valibot parsing in one call.',
  12: 'crypto.randomUUID() — Web Crypto API, available on both edge runtimes and Node.',
  17: 'broadcast() pushes the new recipe to every connected client over WebSockets.',
}

const CODE_FAVORITES_STORE = `export const useFavoritesStore = defineStore('favorites', () => {
  const ids = useLocalStorage<Set<string>>(
    'favorites',
    new Set<string>(),
    { mergeDefaults: true },
  )

  function toggle(id: string) {
    if (ids.value.has(id)) ids.value.delete(id)
    else ids.value.add(id)
  }

  const isFavorite = (id: string) =>
    computed(() => ids.value.has(id))

  return { ids, toggle, isFavorite }
})`
const ANNOT_FAVORITES_STORE: Record<number, string> = {
  1: 'Setup store — composable shape; lets us return reactive refs and methods together.',
  2: 'useLocalStorage from VueUse — already debounces writes for us.',
  13: 'computed isFavorite — reactive without explicit subscription, recomputes on Set changes.',
}

const SECTIONS: Section[] = [
  { id: 'home-page', icon: '🏠', title: 'Home page',
    module: 'pages/index.vue · <script setup>', group: 'pages',
    language: 'vue', code: CODE_HOME_PAGE, annotations: ANNOT_HOME_PAGE,
    summary: 'File-based route at /. Uses useFetch to populate the recipe list.' },
  { id: 'recipes-handler', icon: '🥘', title: 'Recipes Nitro handler',
    module: 'server/api/recipes.get.ts · defineEventHandler()', group: 'api',
    language: 'typescript', code: CODE_RECIPES_HANDLER, annotations: ANNOT_RECIPES_HANDLER,
    summary: 'Server route handling GET /api/recipes.' },
  { id: 'create-handler', icon: '➕', title: 'Create recipe handler',
    module: 'server/api/recipes.post.ts · defineEventHandler()', group: 'api',
    language: 'typescript', code: CODE_CREATE_HANDLER, annotations: ANNOT_CREATE_HANDLER,
    summary: 'POST /api/recipes — validates with Valibot, writes to KV, broadcasts via WebSockets.' },
  { id: 'favorites-store', icon: '⭐', title: 'Favorites store (Pinia)',
    module: 'stores/favorites.ts · useFavoritesStore()', group: 'state',
    language: 'typescript', code: CODE_FAVORITES_STORE, annotations: ANNOT_FAVORITES_STORE,
    summary: 'Pinia setup store storing favourite recipe ids in localStorage.' },
]

const GROUP_ORDER: Group[] = ['pages', 'api', 'state']
const sectionsOrdered = computed(() =>
  GROUP_ORDER.flatMap((g) => SECTIONS.filter((s) => s.group === g)),
)

const open = ref<SectionId | null>(null)
const highlighted = ref<Record<string, string>>({})

function toggle(id: SectionId) {
  open.value = open.value === id ? null : id
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    const prev = open.value
    open.value = null
    document.getElementById(`explain-btn-${prev}`)?.focus()
  }
}

async function highlightSection(section: Section) {
  const html = await codeToHtml(section.code, {
    lang: section.language,
    theme: 'vitesse-dark',
  })
  const annotated = Object.keys(section.annotations).map(Number)
  let lineNo = 0
  highlighted.value[section.id] = html.replace(/<span class="line">/g, () => {
    lineNo += 1
    return annotated.includes(lineNo)
      ? '<span class="line annotated">'
      : '<span class="line">'
  })
}

onMounted(async () => {
  document.addEventListener('keydown', onKey)
  for (const section of SECTIONS) await highlightSection(section)
})

onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <aside class="explain-panel">
    <div class="explain-panel__header">
      <p class="explain-panel__title">🍳 How it works — full data flow</p>
      <div class="explain-panel__chips">
        <span
          v-for="g in GROUP_ORDER"
          :key="g"
          :class="`explain-panel__chip ${GROUP_LABELS[g].modifier}`"
        >
          {{ GROUP_LABELS[g].label }}
        </span>
      </div>
    </div>
    <template v-for="(section, i) in sectionsOrdered" :key="section.id">
      <div class="explain-panel__item">
        <div
          v-if="i === 0 || sectionsOrdered[i - 1].group !== section.group"
          :class="`explain-panel__group-header ${GROUP_LABELS[section.group].modifier}`"
        >
          {{ GROUP_LABELS[section.group].label }}
        </div>
        <button
          :id="`explain-btn-${section.id}`"
          type="button"
          :aria-expanded="open === section.id"
          :aria-controls="`explain-panel-${section.id}`"
          @click="toggle(section.id)"
          :class="`explain-panel__button ${open === section.id ? 'explain-panel__button--active' : ''}`"
        >
          <span class="explain-panel__icon" aria-hidden="true">{{ section.icon }}</span>
          <div class="explain-panel__labels">
            <div>{{ section.title }}</div>
            <div class="explain-panel__module">{{ section.module }}</div>
          </div>
          <span
            :class="`explain-panel__chevron ${open === section.id ? 'explain-panel__chevron--open' : ''}`"
            aria-hidden="true"
          >▾</span>
        </button>
        <div
          :id="`explain-panel-${section.id}`"
          role="region"
          :aria-labelledby="`explain-btn-${section.id}`"
          :class="`explain-panel__region ${open === section.id ? 'explain-panel__region--open' : ''}`"
        >
          <div class="explain-panel__region-inner">
            <div class="explain-panel__content">
              <p v-if="section.summary">{{ section.summary }}</p>
              <div class="explain-panel__code-block">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-html="highlighted[section.id]" />
                <div
                  v-if="Object.keys(section.annotations).length > 0"
                  class="explain-panel__annotations"
                >
                  <div
                    v-for="(note, line) in section.annotations"
                    :key="line"
                    class="explain-panel__annotation"
                  >
                    <span class="explain-panel__annotation-line">L{{ line }}</span>
                    <span class="explain-panel__annotation-note">{{ note }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </aside>
</template>

<style scoped src="./ExplainPanel.css"></style>
