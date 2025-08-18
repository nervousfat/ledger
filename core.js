export const MAX_CENTS = 100_000_000_000;
export const TYPES = Object.freeze(['income', 'expense']);
export const CATEGORIES = Object.freeze(['餐饮', '交通', '购物', '居住', '健康', '娱乐', '工资', '其他']);

export function parseMoney(value) {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('请输入有效金额');
  const text = String(value).trim();
  if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(text)) throw new Error('金额最多保留两位小数');
  const [whole, fraction = ''] = text.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) throw new Error('金额超出允许范围');
  return cents;
}

export function formatMoney(cents) {
  if (!Number.isSafeInteger(cents)) throw new Error('金额必须是整数分');
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100).toLocaleString('zh-CN');
  const fraction = String(absolute % 100).padStart(2, '0');
  const sign = cents < 0 ? '-' : '';
  return sign + '¥' + whole + '.' + fraction;
}

export function normalizeText(value, maxLength, label = '文本') {
  if (typeof value !== 'string') throw new Error(label + '必须是文本');
  const text = value.trim();
  if (text.length > maxLength) throw new Error(label + '长度不能超过 ' + maxLength + ' 个字符');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) throw new Error(label + '包含无效字符');
  if (label === '分类' && !text) throw new Error('请填写分类');
  return text;
}

export function validateDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('日期格式应为 YYYY-MM-DD');
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2100) throw new Error('日期年份应在 1900 到 2100 之间');
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error('日期不存在');
  }
  return value;
}

export function createId() {
  const native = globalThis.crypto?.randomUUID?.();
  if (native) return native;
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return Date.now().toString(36) + '-' + Array.from(bytes, (item) => item.toString(16).padStart(2, '0')).join('');
}

