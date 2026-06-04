<script setup>
defineProps({
  journal: {
    type: Object,
    required: true
  },
  authUser: {
    type: Object,
    default: null
  },
  commentText: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasLiked: {
    type: Boolean,
    default: false
  },
  hasSaved: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:commentText',
  'like',
  'save',
  'comment'
])
</script>

<template>
  <div class="traveler-notes-panel">
    <div class="traveler-notes-header">
      <div>
        <span class="notes-kicker">Traveler Notes</span>
        <h3>Leave a message in the guestbook</h3>
      </div>

      <span class="notes-count">
        {{ journal.comment_count || 0 }} notes
      </span>
    </div>

    <div class="engagement-actions">
      <button
        type="button"
        class="engagement-icon-btn"
        :class="{ active: hasLiked }"
        :disabled="loading"
        @click="emit('like')"
      >
        <i :class="hasLiked ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
        {{ journal.like_count || 0 }}
      </button>
      <span class="engagement-count">
        <i class="bi bi-chat"></i>
        {{ journal.comment_count || 0 }}
      </span>
      <button
        type="button"
        class="engagement-icon-btn"
        :class="{ active: hasSaved }"
        :disabled="loading"
        title="Save journal"
        @click="emit('save')"
      >
        <i :class="hasSaved ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'"></i>
      </button>
    </div>

    <div class="comment-compose">
      <div class="comment-avatar">
        {{ authUser?.username?.charAt(0)?.toUpperCase() || 'U' }}
      </div>
      <div class="comment-input-wrap">
        <input
          :value="commentText"
          type="text"
          placeholder="Write a postcard note for this explorer..."
          @input="emit('update:commentText', $event.target.value)"
          @keyup.enter="emit('comment')"
        />
        <button
          type="button"
          :disabled="loading || !commentText.trim()"
          @click="emit('comment')"
        >
          Post
        </button>
      </div>
    </div>

    <div v-if="journal.comments?.length" class="comment-list">
      <article
        v-for="comment in journal.comments"
        :key="comment.id"
        class="comment-item"
      >
        <div class="comment-avatar">
          {{ comment.username?.charAt(0)?.toUpperCase() || 'U' }}
        </div>
        <div>
          <strong>{{ comment.username }}</strong>
          <p>{{ comment.content }}</p>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.traveler-notes-panel {
  margin-top: 22px;
  padding: 18px;
  min-width: 0;
  border: 1px dashed var(--border);
  border-radius: 20px;
  background:
    repeating-linear-gradient(
      to bottom,
      rgba(196,164,132,0.10) 0,
      rgba(196,164,132,0.10) 1px,
      transparent 1px,
      transparent 30px
    ),
    rgba(255,253,248,0.72);
  min-height: 240px;
}

.traveler-notes-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  min-width: 0;
}

.notes-kicker {
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.traveler-notes-header h3 {
  margin: 2px 0 0;
  color: var(--text-primary);
  font-size: 1.05rem;
  font-weight: 900;
}

.notes-count {
  border: 1px dashed rgba(24,151,160,0.4);
  border-radius: 999px;
  padding: 5px 9px;
  color: var(--accent);
  background: rgba(255,255,255,0.65);
  font-size: 0.72rem;
  font-weight: 900;
  white-space: nowrap;
}

.engagement-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.engagement-icon-btn,
.engagement-count {
  border: none;
  background: transparent;
  color: #1f4e5f;
  padding: 4px 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 900;
}

.engagement-icon-btn i,
.engagement-count i {
  font-size: 1.15rem;
}

.engagement-icon-btn:hover:not(:disabled) {
  color: var(--accent);
}

.engagement-icon-btn.active {
  color: var(--accent);
}

.engagement-icon-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.comment-compose {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.comment-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 900;
}

.comment-input-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-width: 0;
  border: 1px solid #eadfca;
  border-radius: 999px;
  background: var(--surface);
  overflow: hidden;
}

.comment-input-wrap input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-primary);
  padding: 9px 12px;
  font-size: 0.85rem;
  outline: none;
}

.comment-input-wrap input::placeholder {
  color: var(--text-secondary);
}

.comment-input-wrap button {
  border: none;
  background: var(--accent);
  color: #fff;
  align-self: stretch;
  padding: 0 16px;
  font-size: 0.82rem;
  font-weight: 900;
}

.comment-input-wrap button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.comment-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
  max-height: 190px;
  overflow-y: auto;
  padding-right: 4px;
}

.comment-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
  background: rgba(255,255,255,0.58);
  border: 1px solid rgba(234,223,202,0.8);
  border-radius: 14px;
  padding: 10px;
}

.comment-item strong,
.comment-item p {
  display: block;
  overflow-wrap: anywhere;
}

.comment-item strong {
  color: var(--text-primary);
  font-size: 0.82rem;
}

.comment-item p {
  margin: 2px 0 0;
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.45;
}

@media (max-width: 576px) {
  .traveler-notes-panel {
    padding: 14px;
    border-radius: 16px;
  }

  .traveler-notes-header {
    flex-direction: column;
    gap: 10px;
  }

  .engagement-actions {
    justify-content: flex-start;
    margin-bottom: 10px;
  }

  .comment-compose {
    grid-template-columns: 1fr;
  }

  .comment-avatar {
    display: none;
  }

  .comment-input-wrap {
    grid-template-columns: 1fr;
    border-radius: 16px;
  }

  .comment-input-wrap button {
    min-height: 40px;
  }

  .comment-item {
    grid-template-columns: 30px minmax(0, 1fr);
  }
}
</style>

