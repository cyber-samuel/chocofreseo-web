/* ─── Toast Notification System ───────────────────────────────────────
   Uso: import { toast } from '../../../utils/toast';
        toast.success('¡Guardado!');
        toast.error('No se pudo eliminar');
        toast.warning('Revisa los datos');
        toast.info('Recuerda...');
─────────────────────────────────────────────────────────────────────── */

const ICONS = {
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

const COLORS = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', bar: '#16a34a' },
  error:   { bg: '#fff5f5', border: '#fecaca', color: '#991b1b', bar: '#CA0B0B' },
  warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', bar: '#f59e0b' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', bar: '#3b82f6' },
};

let container = null;

function getContainer() {
  if (!container || !document.body.contains(container)) {
    container = document.createElement('div');
    container.id = 'toast-container';
    Object.assign(container.style, {
      position: 'fixed', top: '20px', right: '20px',
      zIndex: '99999', display: 'flex', flexDirection: 'column',
      gap: '10px', maxWidth: '380px', width: 'calc(100vw - 40px)',
      pointerEvents: 'none',
    });
    document.body.appendChild(container);
  }
  return container;
}

function show(message, type = 'info', duration = 4000) {
  const c = getContainer();
  const col = COLORS[type] || COLORS.info;

  const toast = document.createElement('div');
  Object.assign(toast.style, {
    background: col.bg,
    border: `1px solid ${col.border}`,
    color: col.color,
    borderRadius: '14px',
    padding: '14px 16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    fontFamily: "'Nunito', sans-serif",
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '1.4',
    pointerEvents: 'all',
    position: 'relative',
    overflow: 'hidden',
    transform: 'translateX(120%)',
    transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
    opacity: '0',
    cursor: 'default',
    userSelect: 'none',
  });

  toast.innerHTML = `
    <span style="flex-shrink:0;display:flex;align-items:center;margin-top:1px">${ICONS[type]}</span>
    <span style="flex:1">${message}</span>
    <button style="background:none;border:none;cursor:pointer;color:${col.color};opacity:0.6;padding:0;line-height:1;font-size:18px;flex-shrink:0;margin-top:-1px;font-family:inherit" onclick="this.parentElement._dismiss()">✕</button>
    <div style="position:absolute;bottom:0;left:0;height:3px;background:${col.bar};border-radius:0 0 14px 14px;width:100%;transform-origin:left;animation:toast-bar ${duration}ms linear forwards"></div>
  `;

  if (!document.getElementById('toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.textContent = `@keyframes toast-bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}`;
    document.head.appendChild(style);
  }

  let dismissed = false;
  toast._dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 350);
  };

  c.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });

  const timer = setTimeout(() => toast._dismiss(), duration);
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
  toast.addEventListener('mouseleave', () => setTimeout(() => toast._dismiss(), 1500));

  return toast;
}

export const toast = {
  success: (msg, ms) => show(msg, 'success', ms),
  error:   (msg, ms) => show(msg, 'error',   ms || 5000),
  warning: (msg, ms) => show(msg, 'warning', ms),
  info:    (msg, ms) => show(msg, 'info',    ms),
};
