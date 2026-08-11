import * as core from './core.js';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'pocket-ledger:v1';
const clock = new Date();
const today = [clock.getFullYear(), String(clock.getMonth() + 1).padStart(2, '0'), String(clock.getDate()).padStart(2, '0')].join('-');
const currentMonth = today.slice(0, 7);
let entries = [];
let budgetCents = 0;
let damagedStorage = false;
let storageAvailable = true;
let sampleAdded = false;

function notify(message, error = false) {
  $('status').textContent = message;
  $('status').dataset.error = String(error);
}

function load() {
  try {
    const restored = core.recoverStore(localStorage.getItem(STORAGE_KEY));
    entries = restored.entries;
    budgetCents = restored.budgetCents;
    damagedStorage = Boolean(restored.error);
    if (restored.error) notify(restored.error + '。可先下载原始数据，再导入有效备份。', true);
  } catch {
    storageAvailable = false;
    notify('浏览器不允许本地存储。本次记录仅保留到页面关闭，请下载备份。', true);
  }
}

function persist(nextEntries, nextBudget = budgetCents) {
  if (damagedStorage && !window.confirm('现有本地数据已损坏，保存将覆盖原始内容。请先用“下载 JSON 备份”保存原始数据。仍要继续吗？')) return false;
  const backup = core.exportBackup(nextEntries, nextBudget);
  if (storageAvailable) {
    try { localStorage.setItem(STORAGE_KEY, backup); }
    catch { notify('保存失败：浏览器存储已满或不可用。现有账目未修改，请下载备份后再试。', true); return false; }
  }
  entries = nextEntries;
  budgetCents = nextBudget;
  damagedStorage = false;
  render();
  return true;
}

function filtered() {
  return core.filterEntries(entries, { month: $('filter-month').value, type: $('filter-type').value, query: $('filter-query').value });
}

function element(tag, text, className = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function render() {
  const visible = filtered();
  const totals = core.summarize(visible);
  $('income-total').textContent = core.formatMoney(totals.income);
  $('expense-total').textContent = core.formatMoney(totals.expense);
  $('balance-total').textContent = core.formatMoney(totals.balance);
  $('entry-count').textContent = visible.length + ' / ' + entries.length + ' 笔账目';
  $('entries').replaceChildren();
  for (const entry of visible) {
    const row = document.createElement('tr');
    const date = element('td', entry.date);
    if (entry.note) date.append(element('span', entry.note, 'small'));
    const category = element('td', entry.category);
    const amount = element('td', (entry.type === 'income' ? '+' : '−') + core.formatMoney(entry.cents), 'amount-cell ' + entry.type);
    amount.setAttribute('aria-label', (entry.type === 'income' ? '收入 ' : '支出 ') + core.formatMoney(entry.cents));
    const actions = document.createElement('td');
    const buttons = element('div', '', 'actions');
    for (const [action, label] of [['edit', '编辑'], ['delete', '删除']]) {
      const button = element('button', label, 'secondary');
      button.type = 'button';
      button.dataset.action = action;
      button.dataset.id = entry.id;
      button.setAttribute('aria-label', label + ' ' + entry.date + ' ' + entry.category + ' ' + core.formatMoney(entry.cents));
      buttons.append(button);
    }
    actions.append(buttons);
    row.append(date, category, amount, actions);
    $('entries').append(row);
  }
  $('empty-state').hidden = visible.length > 0;
  $('empty-state').querySelector('strong').textContent = entries.length ? '没有符合筛选条件的账目' : '还没有账目';
  $('empty-state').querySelector('p').textContent = entries.length ? '试试其他月份，或清除筛选查看全部。' : '从左侧记下第一笔，或载入示例体验账本。';
  $('categories').replaceChildren();
  const categories = core.summarizeCategories(visible);
  if (!categories.length) $('categories').append(element('p', '暂无支出记录。', 'muted small'));
  for (const group of categories) {
    const row = element('div', '', 'category-row');
    const meter = document.createElement('progress');
    meter.max = 100;
    meter.value = group.share * 100;
    meter.setAttribute('aria-label', group.category + '占支出 ' + Math.round(group.share * 100) + '%');
    row.append(element('span', group.category), element('strong', core.formatMoney(group.cents)), meter);
    $('categories').append(row);
  }
  renderBudget();
  refreshCategories();
}

for (const id of ['filter-month', 'filter-type', 'filter-query']) $(id).addEventListener('input', render);
$('reset-filters').addEventListener('click', () => {
  $('filter-month').value = '';
  $('filter-type').value = '';
  $('filter-query').value = '';
  render();
});

function resetForm() {
  $('entry-form').reset();
  $('entry-id').value = '';
  $('entry-date').value = today;
  $('entry-category').value = '餐饮';
  $('form-title').textContent = '记一笔';
  $('save-entry').textContent = '保存账目';
  $('cancel-edit').hidden = true;
}

$('entry-form').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const id = $('entry-id').value;
    const changes = { type: $('entry-type').value, cents: core.parseMoney($('entry-amount').value), category: $('entry-category').value, date: $('entry-date').value, note: $('entry-note').value };
    const next = id ? core.updateEntry(entries, id, changes) : core.addEntry(entries, changes);
    if (!persist(next)) return;
    resetForm();
    notify((id ? '账目已更新。' : '账目已保存。') + (storageAvailable ? '' : ' 当前仅保留于内存，请下载备份。'));
    $('entry-amount').focus();
  } catch (error) { notify(error.message, true); }
});

$('entries').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const entry = entries.find((item) => item.id === button.dataset.id);
  if (!entry) { notify('该账目已不存在，请重新选择。', true); return; }
  if (button.dataset.action === 'edit') {
    $('entry-id').value = entry.id;
    $('entry-type').value = entry.type;
    $('entry-amount').value = (entry.cents / 100).toFixed(2);
    $('entry-category').value = entry.category;
    $('entry-date').value = entry.date;
    $('entry-note').value = entry.note;
    $('form-title').textContent = '编辑账目';
    $('save-entry').textContent = '保存修改';
    $('cancel-edit').hidden = false;
    $('entry-amount').focus();
    $('entry-form').scrollIntoView({ block: 'nearest' });
    notify('正在编辑 ' + entry.date + ' 的' + entry.category + '账目。');
  } else if (window.confirm('删除这笔 ' + core.formatMoney(entry.cents) + ' 的' + entry.category + '账目？')) {
    try {
      if (persist(core.removeEntry(entries, entry.id))) {
        if ($('entry-id').value === entry.id) resetForm();
        notify('账目已删除。');
      }
    } catch (error) { notify(error.message, true); }
  }
});
$('cancel-edit').addEventListener('click', () => { resetForm(); notify('已取消编辑。'); });
