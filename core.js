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

