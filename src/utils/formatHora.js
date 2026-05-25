export function formatHora12(hora24) {
  const h = Number(hora24);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:00 ${period}`;
}
