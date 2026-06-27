<template>
  <div class="login-page">
    <div class="login-bg" aria-hidden="true">
      <div class="login-bg__mesh" />
      <div class="login-bg__orb login-bg__orb--1" />
      <div class="login-bg__orb login-bg__orb--2" />
      <div class="login-bg__orb login-bg__orb--3" />
    </div>

    <div class="login-shell">
      <aside class="login-hero" aria-hidden="true">
        <div class="login-hero__inner">
          <LoginBrandMark class="login-hero__logo" />
          <p class="login-hero__eyebrow">社員寮オペレーション</p>
          <h2 class="login-hero__title">社員寮の運営を、<br />ひとつに。</h2>
          <p class="login-hero__desc">
            入退寮・空室・寮費を一元管理。<br />
            現場の判断を、すばやく正確に。
          </p>
          <ul class="login-hero__features">
            <li>入退寮・空室状況</li>
            <li>寮費算定・確定</li>
            <li>データ整合チェック</li>
          </ul>
        </div>
      </aside>

      <main class="login-card">
        <div class="login-brand">
          <div class="login-brand__logo-wrap">
            <LoginBrandMark />
          </div>
          <p class="login-brand__eyebrow">ログイン</p>
          <h1 class="login-brand__title">社員寮管理システム</h1>
          <p class="login-brand__sub">メールアドレスとパスワードを入力してください</p>
        </div>

        <el-form
          ref="formRef"
          class="login-form"
          :model="form"
          :rules="loginRules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <el-form-item label="メールアドレス" prop="email">
            <el-input
              v-model="form.email"
              type="email"
              placeholder="name@company.com"
              size="large"
            />
          </el-form-item>
          <el-form-item label="パスワード" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="パスワードを入力"
              size="large"
              show-password
              @keyup.enter="handleSubmit"
            />
          </el-form-item>

          <p v-if="isDev" class="login-hint">
            <span class="login-hint__badge">DEV</span>
            シード実行後：admin@example.com / Admin123!!
          </p>

          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleSubmit"
          >
            ログイン
          </el-button>
        </el-form>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import LoginBrandMark from '@/components/LoginBrandMark.vue';
import { useUserStore } from '@/store/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const formRef = ref();
const loading = ref(false);
const isDev = import.meta.env.DEV;

const form = reactive({
  email: isDev ? 'admin@example.com' : '',
  password: isDev ? 'Admin123!!' : '',
});

const loginRules = {
  email: [
    { required: true, message: 'メールアドレスを入力してください', trigger: 'blur' },
    { type: 'email', message: '形式が正しくありません', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'パスワードを入力してください', trigger: 'blur' },
    { min: 10, message: '10文字以上で入力してください', trigger: 'blur' },
  ],
};

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    await userStore.login(form);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
    router.replace(redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, #0b1220 0%, #111827 38%, #0f172a 68%, #0c4a6e 100%);
}

.login-bg__mesh {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 20%, transparent 75%);
}

.login-bg__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.login-bg__orb--1 {
  width: 420px;
  height: 420px;
  top: -120px;
  left: -80px;
  background: rgba(34, 211, 238, 0.22);
}

.login-bg__orb--2 {
  width: 360px;
  height: 360px;
  bottom: -100px;
  right: -60px;
  background: rgba(99, 102, 241, 0.2);
}

.login-bg__orb--3 {
  width: 240px;
  height: 240px;
  top: 40%;
  left: 55%;
  background: rgba(8, 145, 178, 0.15);
}

.login-shell {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
  max-width: 920px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 32px 80px rgba(0, 0, 0, 0.45);
}

@media (min-width: 860px) {
  .login-shell {
    grid-template-columns: 1.05fr 1fr;
    min-height: 560px;
  }
}

.login-hero {
  display: none;
  padding: 48px 44px;
  background:
    linear-gradient(160deg, rgba(8, 145, 178, 0.18) 0%, rgba(99, 102, 241, 0.12) 100%),
    rgba(15, 23, 42, 0.72);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  color: #f8fafc;
}

@media (min-width: 860px) {
  .login-hero {
    display: flex;
    align-items: center;
  }
}

.login-hero__inner {
  max-width: 320px;
}

.login-hero__logo {
  width: 88px;
  height: 88px;
  margin-bottom: 28px;
}

.login-hero__eyebrow {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(165, 243, 252, 0.85);
}

.login-hero__title {
  margin: 0 0 16px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.login-hero__desc {
  margin: 0 0 28px;
  font-size: 14px;
  line-height: 1.75;
  color: rgba(226, 232, 240, 0.78);
}

.login-hero__features {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.login-hero__features li {
  position: relative;
  padding-left: 18px;
  font-size: 13px;
  color: rgba(241, 245, 249, 0.88);
}

.login-hero__features li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22d3ee, #818cf8);
  box-shadow: 0 0 8px rgba(34, 211, 238, 0.6);
}

.login-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 36px 36px;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(20px);
}

@media (min-width: 860px) {
  .login-card {
    padding: 48px 44px;
  }
}

.login-brand {
  text-align: center;
  margin-bottom: 28px;
}

@media (min-width: 860px) {
  .login-brand {
    text-align: left;
  }

  .login-brand__logo-wrap {
    display: none;
  }
}

.login-brand__logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.login-brand__logo-wrap :deep(.brand-mark) {
  width: 76px;
  height: 76px;
}

.login-brand__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--app-accent);
}

.login-brand__title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--app-text);
}

.login-brand__sub {
  margin: 0;
  font-size: 14px;
  color: var(--app-text-secondary);
  line-height: 1.5;
}

.login-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--app-text);
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px var(--app-border) inset;
  padding: 4px 14px;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px var(--app-accent) inset,
    0 0 0 3px rgba(8, 145, 178, 0.12);
}

.login-btn {
  width: 100%;
  margin-top: 4px;
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: 0.02em;
}

.login-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 12px;
  color: var(--app-text-secondary);
  line-height: 1.5;
}

@media (min-width: 860px) {
  .login-hint {
    justify-content: flex-start;
  }
}

.login-hint__badge {
  display: inline-flex;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #0e7490;
  background: #ecfeff;
  border: 1px solid #a5f3fc;
}
</style>
