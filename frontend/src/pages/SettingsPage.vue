<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import { useI18n } from 'vue-i18n'
import 'vue-advanced-cropper/dist/style.css'

import MainLayout from '@/layouts/MainLayout.vue'
import { uploadJournalMedia } from '@/services/journalService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { setI18nLanguage } from '@/i18n'

const authStore = useAuthStore()
const toastStore = useToastStore()
const { t } = useI18n()

const savingProfile = ref(false)
const savingSettings = ref(false)
const selectedProfileFile = ref(null)
const profilePreviewUrl = ref(authStore.user?.profile_image || '')
const croppedProfilePreviewUrl = ref('')
const profileImageInput = ref(null)
const cropperRef = ref(null)

const profileForm = reactive({
  username: authStore.user?.username || '',
  bio: authStore.user?.bio || '',
  profile_image: authStore.user?.profile_image || ''
})

const settingsForm = reactive({
  appearance_theme: authStore.user?.appearance_theme || localStorage.getItem('theme') || 'light',
  color_scheme: authStore.user?.color_scheme || localStorage.getItem('color_scheme') || 'teal',
  font_size: authStore.user?.font_size || 'normal',
  larger_text: Boolean(authStore.user?.larger_text),
  reduced_motion: Boolean(authStore.user?.reduced_motion),
  high_contrast: Boolean(authStore.user?.high_contrast),
  notify_likes: authStore.user?.notify_likes !== 0,
  notify_comments: authStore.user?.notify_comments !== 0,
  default_journal_visibility: authStore.user?.default_journal_visibility || 'public',
  language: authStore.user?.language || localStorage.getItem('language') || 'English'
})

const autoSaveReady = ref(false)

const profileInitial = computed(() =>
  profileForm.username?.charAt(0)?.toUpperCase() || 'U'
)

function handleProfileFile(event) {
  const file = event.target.files?.[0]

  if (!file) return

  if (!file.type.startsWith('image/')) {
    toastStore.danger(t('settings.chooseImage'))
    event.target.value = ''
    return
  }

  selectedProfileFile.value = file
  croppedProfilePreviewUrl.value = ''
  profilePreviewUrl.value = URL.createObjectURL(file)
}

function clearSelectedProfileImage() {
  selectedProfileFile.value = null
  croppedProfilePreviewUrl.value = ''
  profilePreviewUrl.value = profileForm.profile_image

  if (profileImageInput.value) {
    profileImageInput.value.value = ''
  }
}

function updateCroppedProfilePreview({ canvas } = {}) {
  if (!canvas) return
  croppedProfilePreviewUrl.value = canvas.toDataURL('image/jpeg', 0.9)
}

async function createCroppedProfileFile() {
  const result = cropperRef.value?.getResult()
  const canvas = result?.canvas

  if (!canvas) return null

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      resolve(new File([blob], 'profile-image.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  })
}

const appearanceColorSchemes = ['teal', 'sunset']

function applyColorScheme(colorScheme = 'teal') {
  const scheme = appearanceColorSchemes.includes(colorScheme) ? colorScheme : 'teal'
  appearanceColorSchemes.forEach((item) => {
    document.body.classList.toggle(`color-scheme-${item}`, item === scheme)
  })
}

async function saveProfile() {
  try {
    savingProfile.value = true
    let profileImage = profileForm.profile_image

    if (selectedProfileFile.value) {
      const croppedFile = await createCroppedProfileFile()
      const [uploadedImage] = await uploadJournalMedia([croppedFile])
      profileImage = uploadedImage?.url || profileImage
      profileForm.profile_image = profileImage
    }

    await authStore.saveProfile({
      ...profileForm,
      profile_image: profileImage
    })

    selectedProfileFile.value = null
    croppedProfilePreviewUrl.value = ''
    profilePreviewUrl.value = profileImage
    if (profileImageInput.value) {
      profileImageInput.value.value = ''
    }
    toastStore.success(t('settings.profileUpdated'))
  } catch (error) {
    toastStore.danger(error.response?.data?.message || t('settings.profileError'))
  } finally {
    savingProfile.value = false
  }
}

async function saveSettings(showSuccessToast = false) {
  try {
    savingSettings.value = true
    await authStore.saveSettings(settingsForm)
    localStorage.setItem('theme', settingsForm.appearance_theme)
    localStorage.setItem('color_scheme', settingsForm.color_scheme)
    localStorage.setItem('language', settingsForm.language)
    setI18nLanguage(settingsForm.language)
    document.body.classList.toggle('dark-mode', settingsForm.appearance_theme === 'dark')
    document.body.classList.toggle('large-text-mode', Boolean(settingsForm.larger_text) || settingsForm.font_size === 'large')
    document.body.classList.toggle('small-text-mode', settingsForm.font_size === 'small')
    document.body.classList.toggle('reduced-motion-mode', settingsForm.reduced_motion)
    document.body.classList.toggle('high-contrast-mode', settingsForm.high_contrast)
    applyColorScheme(settingsForm.color_scheme)

    if (showSuccessToast) {
      toastStore.success(t('settings.settingsSaved'))
    }
  } catch {
    toastStore.danger(t('settings.settingsError'))
  } finally {
    savingSettings.value = false
  }
}

watch(
  settingsForm,
  async () => {
    if (!autoSaveReady.value) return
    await saveSettings(false)
  },
  { deep: true }
)

onMounted(() => {
  autoSaveReady.value = true
})
</script>

<template>
  <MainLayout>
    <main class="settings-page">
      <section class="settings-shell">
        <header class="settings-hero">
          <div>
            <span>{{ t('settings.eyebrow') }}</span>
            <h1>{{ t('settings.title') }}</h1>
            <p>
              {{ t('settings.intro') }}
            </p>
          </div>
        </header>

        <section class="settings-card profile-card">
          <div class="section-title">
            <div>
              <span>{{ t('settings.profile') }}</span>
              <h2>{{ t('settings.profileTitle') }}</h2>
            </div>

            <button
              type="button"
              class="save-btn"
              :disabled="savingProfile"
              @click="saveProfile"
            >
              {{ savingProfile ? t('settings.savingProfile') : selectedProfileFile ? t('settings.saveCroppedImage') : t('settings.saveProfile') }}
            </button>
          </div>

          <div class="profile-editor">
            <div class="profile-preview">
              <img
                v-if="profilePreviewUrl"
                :src="profilePreviewUrl"
                :alt="t('settings.profilePreviewAlt', { name: profileForm.username || t('dashboard.explorer') })"
              />
              <span v-else>{{ profileInitial }}</span>
            </div>

            <div class="profile-fields">
              <label>
                {{ t('settings.username') }}
                <input v-model="profileForm.username" type="text" />
              </label>

              <div class="profile-upload-field">
                <span>{{ t('settings.profileImage') }}</span>

                <label class="image-upload-card">
                  <input
                    ref="profileImageInput"
                    type="file"
                    accept="image/*"
                    @change="handleProfileFile"
                  />

                  <div class="upload-icon">
                    <i class="bi bi-cloud-arrow-up"></i>
                  </div>

                  <div class="upload-content">
                    <strong>
                      {{ selectedProfileFile ? selectedProfileFile.name : t('settings.chooseProfileImage') }}
                    </strong>

                    <small>
                      {{ t('settings.uploadProfileHint') }}
                    </small>
                  </div>

                  <span class="upload-action">
                    {{ t('settings.browse') }}
                  </span>
                </label>
              </div>

              <label class="full">
                {{ t('settings.bio') }}
                <textarea
                  v-model="profileForm.bio"
                  rows="3"
                  :placeholder="t('settings.bioPlaceholder')"
                ></textarea>
              </label>
            </div>
          </div>

          <div v-if="selectedProfileFile" class="crop-panel">
            <div class="crop-panel-heading">
              <div>
                <span>{{ t('settings.cropPreview') }}</span>
                <strong>{{ t('settings.adjustExplorerPhoto') }}</strong>
                <p>{{ t('settings.cropInstruction') }}</p>
              </div>

              <button
                type="button"
                class="clear-image-btn"
                :aria-label="t('common.cancel')"
                @click="clearSelectedProfileImage"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <div class="crop-layout">
              <Cropper
                ref="cropperRef"
                class="profile-cropper"
                :src="profilePreviewUrl"
                :stencil-props="{ aspectRatio: 1 }"
                :canvas="{ width: 512, height: 512 }"
                @change="updateCroppedProfilePreview"
              />

              <div class="crop-helper-card">
                <div class="mini-preview">
                  <img :src="croppedProfilePreviewUrl || profilePreviewUrl" :alt="t('settings.selectedProfilePreviewAlt')" />
                </div>

                <strong>{{ t('settings.liveAvatarPreview') }}</strong>
                <small>
                  {{ t('settings.cropApplyHint') }}
                </small>

                <div class="crop-actions">
                  <button
                    type="button"
                    class="crop-cancel-btn"
                    @click="clearSelectedProfileImage"
                  >
                    {{ t('common.cancel') }}
                  </button>

                  <button
                    type="button"
                    class="save-btn crop-save-btn"
                    :disabled="savingProfile"
                    @click="saveProfile"
                  >
                    {{ savingProfile ? t('settings.savingProfile') : t('settings.saveCroppedImage') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="settings-grid">
          <article class="settings-card">
            <div class="section-title compact">
              <div>
                <span>{{ t('settings.appearance') }}</span>
                <h2>{{ t('settings.display') }}</h2>
              </div>
              <i class="bi bi-palette"></i>
            </div>

            <div class="setting-row">
              <div>
                <strong>{{ t('settings.theme') }}</strong>
                <small>{{ t('settings.themeHint') }}</small>
              </div>

              <span class="select-shell">
                <select v-model="settingsForm.appearance_theme">
                  <option value="light">{{ t('common.light') }}</option>
                  <option value="dark">{{ t('common.dark') }}</option>
                </select>
                <i class="bi bi-chevron-down"></i>
              </span>
            </div>

            <div class="setting-row">
              <div>
                <strong>{{ t('settings.colorPalette') }}</strong>
                <small>{{ t('settings.colorPaletteHint') }}</small>
              </div>

              <span class="select-shell">
                <select v-model="settingsForm.color_scheme">
                  <option value="teal">{{ t('settings.colorPalettes.teal') }}</option>
                  <option value="sunset">{{ t('settings.colorPalettes.sunset') }}</option>
                </select>
                <i class="bi bi-chevron-down"></i>
              </span>
            </div>

            <div class="setting-row">
              <div>
                <strong>{{ t('settings.fontSize') }}</strong>
                <small>{{ t('settings.fontHint') }}</small>
              </div>

              <span class="select-shell">
                <select v-model="settingsForm.font_size">
                  <option value="small">{{ t('common.small') }}</option>
                  <option value="normal">{{ t('common.normal') }}</option>
                  <option value="large">{{ t('common.large') }}</option>
                </select>
                <i class="bi bi-chevron-down"></i>
              </span>
            </div>
          </article>

          <article class="settings-card">
            <div class="section-title compact">
              <div>
                <span>{{ t('settings.accessibility') }}</span>
                <h2>{{ t('settings.comfort') }}</h2>
              </div>
              <i class="bi bi-universal-access"></i>
            </div>

            <label class="toggle-row">
              <div>
                <strong>{{ t('settings.reducedMotion') }}</strong>
                <small>{{ t('settings.reducedMotionHint') }}</small>
              </div>
              <input v-model="settingsForm.reduced_motion" type="checkbox" class="switch-input" />
              <i class="switch-track"></i>
            </label>

            <label class="toggle-row">
              <div>
                <strong>{{ t('settings.highContrast') }}</strong>
                <small>{{ t('settings.highContrastHint') }}</small>
              </div>
              <input v-model="settingsForm.high_contrast" type="checkbox" class="switch-input" />
              <i class="switch-track"></i>
            </label>
          </article>

          <article class="settings-card">
            <div class="section-title compact">
              <div>
                <span>{{ t('settings.notifications') }}</span>
                <h2>{{ t('settings.activityAlerts') }}</h2>
              </div>
              <i class="bi bi-bell"></i>
            </div>

            <label class="toggle-row">
              <div>
                <strong>{{ t('settings.journalLikes') }}</strong>
                <small>{{ t('settings.journalLikesHint') }}</small>
              </div>
              <input v-model="settingsForm.notify_likes" type="checkbox" class="switch-input" />
              <i class="switch-track"></i>
            </label>

            <label class="toggle-row">
              <div>
                <strong>{{ t('settings.journalComments') }}</strong>
                <small>{{ t('settings.journalCommentsHint') }}</small>
              </div>
              <input v-model="settingsForm.notify_comments" type="checkbox" class="switch-input" />
              <i class="switch-track"></i>
            </label>
          </article>

          <article class="settings-card">
            <div class="section-title compact">
              <div>
                <span>{{ t('settings.privacy') }}</span>
                <h2>{{ t('settings.journalDefault') }}</h2>
              </div>
              <i class="bi bi-lock"></i>
            </div>

            <div class="setting-row">
              <div>
                <strong>{{ t('settings.defaultVisibility') }}</strong>
                <small>{{ t('settings.defaultVisibilityHint') }}</small>
              </div>

              <span class="select-shell">
                <select v-model="settingsForm.default_journal_visibility">
                  <option value="public">{{ t('common.public') }}</option>
                  <option value="private">{{ t('common.private') }}</option>
                </select>
                <i class="bi bi-chevron-down"></i>
              </span>
            </div>
          </article>

          <article class="settings-card">
            <div class="section-title compact">
              <div>
                <span>{{ t('settings.language') }}</span>
                <h2>{{ t('settings.interface') }}</h2>
              </div>
              <i class="bi bi-globe2"></i>
            </div>

            <div class="setting-row">
              <div>
                <strong>{{ t('settings.language') }}</strong>
                <small>{{ t('settings.languageHint') }}</small>
              </div>

              <span class="select-shell">
                <select v-model="settingsForm.language">
                  <option value="English">{{ t('common.english') }}</option>
                  <option value="中文">{{ t('common.chinese') }}</option>
                </select>
                <i class="bi bi-chevron-down"></i>
              </span>
            </div>
          </article>
        </section>

      </section>
    </main>
  </MainLayout>
</template>

<style scoped>
.settings-page {
  min-height: calc(100vh - 80px);
  padding: 34px 0 56px;
  background:
    radial-gradient(circle at top left, rgba(169,216,214,0.28), transparent 32%),
    linear-gradient(180deg, #fffdf8 0%, #f7efe2 100%);
}

.settings-shell {
  width: min(1080px, calc(100% - 32px));
  margin: 0 auto;
}

.settings-hero {
  margin-bottom: 20px;
  padding: 26px;
  border: 1px dashed var(--border);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255,253,248,0.96), rgba(251,247,239,0.96)),
    repeating-linear-gradient(0deg, transparent 0 31px, rgba(216,205,187,0.3) 32px);
  box-shadow: 0 16px 34px rgba(47,72,88,0.08);
}

.settings-hero span,
.section-title span {
  color: var(--accent);
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-hero h1 {
  margin: 6px 0;
  color: var(--text-primary);
  font-weight: 900;
  font-size: clamp(2rem, 4vw, 3rem);
}

.settings-hero p {
  max-width: 680px;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.settings-card {
  padding: 20px;
  border: 1px dashed var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: 0 14px 30px var(--shadow);
}

.profile-card {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
}

.section-title h2 {
  margin: 3px 0 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 900;
}

.section-title.compact i {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 1.2rem;
}

.profile-editor {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.profile-preview {
  width: 104px;
  height: 104px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  border: 3px solid var(--accent);
  font-size: 2rem;
  font-weight: 900;
}

.profile-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.profile-fields .full {
  grid-column: 1 / -1;
}

.image-upload-field input[type='file'] {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.profile-upload-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-upload-field span {
  font-size: 0.84rem;
  font-weight: 900;
  color: var(--text-primary);
}

.image-upload-card {
  position: relative;
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 14px;
  align-items: center;

  padding: 16px;
  border-radius: 18px;
  border: 1px dashed var(--accent-soft);

  background: var(--surface-soft);
  cursor: pointer;

  transition: all 0.2s ease;
}

.image-upload-card:hover {
  border-color: var(--accent);
  background: var(--surface);
}

.image-upload-card input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-icon {
  width: 52px;
  height: 52px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 16px;

  background: var(--accent-soft);
  color: var(--accent);

  font-size: 1.4rem;
}

.upload-content {
  min-width: 0;
}

.upload-content strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.upload-content small {
  display: block;
  margin-top: 4px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.upload-action {
  padding: 8px 14px;
  border-radius: 999px;

  background: var(--accent);
  color: white !important;

  font-size: 0.8rem;
  font-weight: 800;
}

.crop-panel {
  display: grid;
  gap: 14px;
  margin-top: 18px;
  padding: 16px;
  border: 1px dashed var(--border);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255,253,248,0.96), rgba(251,247,239,0.96)),
    repeating-linear-gradient(0deg, transparent 0 31px, rgba(216,205,187,0.28) 32px);
}

.crop-panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.crop-panel-heading span {
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.crop-panel-heading strong {
  display: block;
  margin-top: 3px;
  color: var(--text-primary);
  font-size: 1rem;
}

.crop-panel-heading p {
  margin: 3px 0 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.clear-image-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: var(--surface-soft);
  color: #dc3545;
}

.crop-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 14px;
  align-items: stretch;
}

.profile-cropper {
  height: 320px;
  overflow: hidden;
  border: 1px solid #eadfca;
  border-radius: 18px;
  background: var(--accent-soft);
}

.crop-helper-card {
  display: grid;
  align-content: start;
  gap: 10px;
  min-width: 0;
  padding: 14px;
  border: 1px dashed var(--border);
  border-radius: 18px;
  background: var(--surface);
}

.mini-preview {
  width: 92px;
  height: 92px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 50%;
  background: var(--accent-soft);
  border: 4px solid #fffdf8;
  box-shadow: 0 10px 20px rgba(47,72,88,0.12);
}

.mini-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.crop-helper-card strong {
  color: var(--text-primary);
  text-align: center;
}

.crop-helper-card small {
  color: var(--text-secondary);
  font-size: 0.76rem;
  line-height: 1.45;
  text-align: center;
}

.crop-actions {
  display: grid;
  gap: 8px;
  margin-top: 4px;
}

.crop-cancel-btn {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 9px 12px;
  background: var(--surface-soft);
  color: var(--text-primary);
  font-weight: 900;
}

.crop-cancel-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.crop-save-btn {
  width: 100%;
  padding-inline: 12px;
}

label,
.setting-row {
  color: var(--text-primary);
}

label {
  font-size: 0.84rem;
  font-weight: 900;
}

input,
textarea,
select {
  width: 100%;
  margin-top: 6px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--surface-soft);
  color: var(--text-primary);
  font: inherit;
}

textarea {
  resize: vertical;
}

select {
  min-width: 150px;
  appearance: none;
  background: var(--surface-soft);
  color: var(--text-primary);
  font-weight: 800;
}

.select-shell {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: min(190px, 100%);
}

.select-shell select {
  width: 100%;
  padding-right: 36px;
  margin-top: 0;
}

.select-shell i {
  position: absolute;
  right: 12px;
  color: var(--accent);
  font-size: 0.85rem;
  pointer-events: none;
}

.setting-row,
.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-top: 1px dashed #eadfca;
}

.setting-row:first-of-type,
.toggle-row:first-of-type {
  border-top: none;
}

.setting-row strong,
.toggle-row strong {
  display: block;
  color: var(--text-primary);
  font-size: 0.92rem;
}

.setting-row small,
.toggle-row small {
  display: block;
  margin-top: 2px;
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
}

.setting-row select,
.setting-row .select-shell {
  max-width: 190px;
  margin-top: 0;
}

.toggle-row {
  position: relative;
}

.switch-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch-track {
  position: relative;
  width: 50px;
  height: 28px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: var(--border);
  transition: background 0.18s ease;
}

.switch-track::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: 0 3px 8px rgba(47,72,88,0.18);
  transition: transform 0.18s ease;
}

.switch-input:checked + .switch-track {
  background: var(--accent);
}

.switch-input:checked + .switch-track::after {
  transform: translateX(22px);
}

.switch-input:focus-visible + .switch-track {
  outline: 3px solid rgba(24,151,160,0.24);
  outline-offset: 3px;
}

.save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: var(--accent);
  color: #ffffff;
  font-weight: 900;
  box-shadow: 0 10px 20px rgba(24,151,160,0.16);
}

.save-btn:hover:not(:disabled) {
  background: var(--accent-strong);
  transform: translateY(-1px);
}

.save-btn:disabled {
  cursor: wait;
  opacity: 0.65;
}

.main-save {
  min-width: 170px;
}

@media (max-width: 900px) {
  .settings-grid,
  .profile-editor,
  .profile-fields,
  .crop-layout {
    grid-template-columns: 1fr;
  }

  .profile-preview {
    margin: 0 auto;
  }

  .crop-helper-card {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
  }

  .mini-preview {
    margin: 0;
  }

  .crop-helper-card strong,
  .crop-helper-card small {
    text-align: left;
  }

  .crop-actions {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 575px) {
  .image-upload-card {
    grid-template-columns: 52px 1fr;
  }
  
  .upload-action {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .settings-shell {
    width: min(100% - 20px, 1080px);
  }

  .settings-hero,
  .settings-card {
    padding: 18px;
  }

  .crop-panel {
    padding: 12px;
    border-radius: 16px;
  }

  .crop-panel-heading {
    gap: 10px;
  }

  .profile-cropper {
    height: 260px;
    border-radius: 14px;
  }

  .crop-helper-card {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .crop-helper-card strong,
  .crop-helper-card small {
    text-align: center;
  }

  .crop-actions {
    width: 100%;
    grid-template-columns: 1fr;
  }

  .section-title,
  .setting-row,
  .toggle-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .setting-row select {
    max-width: none;
  }

  .main-save {
    width: 100%;
  }
}
</style>
