import { useUserStore } from '@/store/user';

function checkEl(el, binding) {
  const userStore = useUserStore();
  const { value, arg } = binding;

  let visible = true;
  if (arg === 'role') {
    visible = userStore.hasRole(value);
  } else if (value) {
    visible = userStore.hasPermission(value);
  }

  el.style.display = visible ? '' : 'none';
}

export default {
  mounted(el, binding) {
    checkEl(el, binding);
  },
  updated(el, binding) {
    checkEl(el, binding);
  },
};
