<template>
  <div class="error-page">
    <p class="error-page__code">404</p>
    <h1 class="error-page__title">ページが見つかりません</h1>
    <p class="error-page__desc">URL が変更されたか、削除された可能性があります。</p>
    <div class="error-page__actions">
      <el-button type="primary" @click="$router.push('/')">ホームへ</el-button>
      <el-button @click="$router.back()">前のページへ</el-button>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background: var(--app-bg);
  text-align: center;
}

.error-page__code {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--app-accent);
}

.error-page__title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--app-text);
}

.error-page__desc {
  margin: 0 0 12px;
  max-width: 360px;
  color: var(--app-text-secondary);
  line-height: 1.6;
}

.error-page__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
