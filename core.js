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

export function normalizeEntry(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('无效账目');
  const id = normalizeText(input.id ?? createId(), 80, '标识');
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('账目标识无效');
  if (!TYPES.includes(input.type)) throw new Error('请选择收入或支出');
  if (!Number.isSafeInteger(input.cents) || input.cents <= 0 || input.cents > MAX_CENTS) throw new Error('金额必须大于零且在范围内');
  const category = normalizeText(input.category, 40, '分类');
  const note = normalizeText(input.note ?? '', 300, '备注');
  const date = validateDate(input.date);
  return { id, type: input.type, cents: input.cents, category, note, date };
}

export function sortEntries(entries) {
  if (!Array.isArray(entries)) throw new Error('账目应为数组');
  const copy = entries.map(normalizeEntry);
  copy.sort((left, right) => {
    const dateOrder = right.date.localeCompare(left.date);
    return dateOrder || left.id.localeCompare(right.id);
  });
  return copy;
}

export function addEntry(entries, input) {
  const entry = normalizeEntry(input);
  if (!Array.isArray(entries)) throw new Error('账目应为数组');
  if (entries.length >= 10000) throw new Error('最多保存 10000 条账目');
  if (entries.some((item) => item.id === entry.id)) throw new Error('账目标识重复');
  const updated = [...entries, entry];
  return sortEntries(updated);
}

export function removeEntry(entries, id) {
  if (!Array.isArray(entries)) throw new Error('账目应为数组');
  if (typeof id !== 'string' || !id) throw new Error('缺少账目标识');
  const current = sortEntries(entries);
  const index = current.findIndex((entry) => entry.id === id);
  if (index === -1) throw new Error('账目不存在，可能已在其他窗口删除');
  current.splice(index, 1);
  return current;
}

export function updateEntry(entries, id, changes) {
  const current = sortEntries(entries);
  const index = current.findIndex((entry) => entry.id === id);
  if (index < 0) throw new Error('账目不存在，可能已在其他窗口删除');
  if (!changes || typeof changes !== 'object') throw new Error('无效修改');
  const updated = normalizeEntry({ ...current[index], ...changes, id });
  current[index] = updated;
  return sortEntries(current);
}

export function filterEntries(entries, filters = {}) {
  const { month = '', type = '', query = '' } = filters;
  if (month && !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month)) throw new Error('无效月份');
  if (type && !TYPES.includes(type)) throw new Error('无效收支类型');
  const search = String(query).trim().toLocaleLowerCase();
  return sortEntries(entries).filter((entry) => {
    if (month && !entry.date.startsWith(month)) return false;
    if (type && entry.type !== type) return false;
    return !search || (entry.category + ' ' + entry.note).toLocaleLowerCase().includes(search);
  });
}

export function summarize(entries) {
  let income = 0;
  let expense = 0;
  for (const entry of sortEntries(entries)) {
    if (entry.type === 'income') income += entry.cents;
    else expense += entry.cents;
    if (!Number.isSafeInteger(income) || !Number.isSafeInteger(expense)) throw new Error('汇总金额超出精度范围');
  }
  return { income, expense, balance: income - expense, count: entries.length };
}

export function summarizeCategories(entries, type = 'expense') {
  if (!TYPES.includes(type)) throw new Error('无效收支类型');
  const groups = new Map();
  for (const entry of sortEntries(entries)) {
    if (entry.type !== type) continue;
    groups.set(entry.category, (groups.get(entry.category) ?? 0) + entry.cents);
  }
  const total = [...groups.values()].reduce((sum, value) => sum + value, 0);
  return [...groups].map(([category, cents]) => ({ category, cents, share: total ? cents / total : 0 }))
    .sort((left, right) => right.cents - left.cents || left.category.localeCompare(right.category));
}

export function groupByMonth(entries) {
  const groups = new Map();
  for (const entry of sortEntries(entries)) {
    const month = entry.date.slice(0, 7);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(entry);
  }
  return [...groups].map(([month, values]) => ({ month, ...summarize(values) }))
    .sort((left, right) => right.month.localeCompare(left.month));
}

export function exportCsv(entries) {
  const protect = (value) => {
    let text = String(value);
    if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const rows = [['日期', '类型', '分类', '金额（元）', '备注']];
  for (const entry of sortEntries(entries)) {
    rows.push([entry.date, entry.type === 'income' ? '收入' : '支出', entry.category, (entry.cents / 100).toFixed(2), entry.note]);
  }
  return '\ufeff' + rows.map((row) => row.map(protect).join(',')).join('\r\n');
}

export function exportBackup(entries, budgetCents = 0) {
  if (!Number.isSafeInteger(budgetCents) || budgetCents < 0 || budgetCents > MAX_CENTS) throw new Error('预算无效');
  const cleaned = sortEntries(entries);
  if (cleaned.length > 10000) throw new Error('账目数量过多');
  const ids = new Set(cleaned.map((entry) => entry.id));
  if (ids.size !== cleaned.length) throw new Error('账目标识重复');
  const backup = { app: 'pocket-ledger', version: 1, budgetCents, entries: cleaned };
  return JSON.stringify(backup, null, 2);
}

export function importBackup(text) {
  if (typeof text !== 'string' || text.length > 5_000_000) throw new Error('备份文件无效或超过 5 MB');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('无法读取 JSON 备份'); }
  if (!value || value.app !== 'pocket-ledger' || value.version !== 1) throw new Error('备份来源或版本不受支持');
  if (!Array.isArray(value.entries)) throw new Error('备份缺少账目数组');
  if (value.entries.some((entry) => !entry || typeof entry.id !== 'string' || !entry.id)) throw new Error('备份账目缺少标识');
  const canonical = exportBackup(value.entries, value.budgetCents);
  const valid = JSON.parse(canonical);
  return { entries: valid.entries, budgetCents: valid.budgetCents };
}

