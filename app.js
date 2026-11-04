const tables = {
  users: {
    group: 'public', label: 'users',
    columns: [
      { name: 'id', type: 'int', numeric: true },
      { name: 'name', type: 'text' },
      { name: 'email', type: 'text' },
      { name: 'role', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'created_at', type: 'date' },
    ],
    rows: [
      { id: 1, name: 'Ava Chen', email: 'ava.chen@example.com', role: 'admin', status: 'active', created_at: '2025-01-18' },
      { id: 2, name: 'Noah Patel', email: 'noah.patel@example.com', role: 'editor', status: 'active', created_at: '2025-02-03' },
      { id: 3, name: 'Mia Johnson', email: 'mia.johnson@example.com', role: 'viewer', status: 'pending', created_at: '2025-03-11' },
      { id: 4, name: 'Leo Kim', email: 'leo.kim@example.com', role: 'editor', status: 'active', created_at: '2025-04-27' },
    ],
  },
  orders: {
    group: 'public', label: 'orders',
    columns: [
      { name: 'id', type: 'int', numeric: true },
      { name: 'user_id', type: 'int', numeric: true },
      { name: 'total', type: 'decimal', numeric: true },
      { name: 'status', type: 'text' },
      { name: 'created_at', type: 'date' },
    ],
    rows: [
      { id: 1042, user_id: 1, total: 89.5, status: 'paid', created_at: '2025-05-06' },
      { id: 1043, user_id: 2, total: 142, status: 'processing', created_at: '2025-05-08' },
      { id: 1044, user_id: 1, total: 34.99, status: 'paid', created_at: '2025-05-11' },
      { id: 1045, user_id: 4, total: 210.75, status: 'shipped', created_at: '2025-05-12' },
    ],
  },
  products: {
    group: 'public', label: 'products',
    columns: [
      { name: 'id', type: 'int', numeric: true },
      { name: 'name', type: 'text' },
      { name: 'category', type: 'text' },
      { name: 'price', type: 'decimal', numeric: true },
      { name: 'in_stock', type: 'boolean' },
    ],
    rows: [
      { id: 201, name: 'Field Notes', category: 'Stationery', price: 18, in_stock: true },
      { id: 202, name: 'Canvas Tote', category: 'Accessories', price: 32.5, in_stock: true },
      { id: 203, name: 'Desk Lamp', category: 'Home', price: 74.99, in_stock: false },
      { id: 204, name: 'Ceramic Cup', category: 'Home', price: 24, in_stock: true },
    ],
  },
  events: {
    group: 'analytics', label: 'events',
    columns: [
      { name: 'id', type: 'int', numeric: true },
      { name: 'user_id', type: 'int', numeric: true },
      { name: 'event_name', type: 'text' },
      { name: 'page', type: 'text' },
      { name: 'occurred_at', type: 'date' },
    ],
    rows: [
      { id: 501, user_id: 1, event_name: 'page_view', page: '/dashboard', occurred_at: '2025-05-10' },
      { id: 502, user_id: 2, event_name: 'sign_in', page: '/login', occurred_at: '2025-05-10' },
      { id: 503, user_id: 3, event_name: 'page_view', page: '/pricing', occurred_at: '2025-05-11' },
      { id: 504, user_id: 1, event_name: 'export', page: '/reports', occurred_at: '2025-05-12' },
    ],
  },
};

const state = { table: 'users', selected: new Set(['id', 'name', 'email', 'role']), filters: [], sorts: [], filterId: 0, sortId: 0, saved: [] };
const elements = {
  schemaList: document.querySelector('#schemaList'), tableSelect: document.querySelector('#tableSelect'), columnList: document.querySelector('#columnList'),
  filterList: document.querySelector('#filterList'), sortList: document.querySelector('#sortList'), filterHint: document.querySelector('#filterHint'),
  sortHint: document.querySelector('#sortHint'), filterCount: document.querySelector('#filterCount'), limit: document.querySelector('#limitInput'),
  dialect: document.querySelector('#dialect'), preview: document.querySelector('#sqlPreview'), lines: document.querySelector('#lineNumbers'), lineCount: document.querySelector('#lineCount'),
  rowEstimate: document.querySelector('#rowEstimate'), toast: document.querySelector('#toast'), resultPanel: document.querySelector('#resultPanel'), resultContent: document.querySelector('#resultContent'),
};
let toastTimeout;

function currentTable() { return tables[state.table]; }
function escapeIdentifier(value, dialect = elements.dialect.value) {
  const quote = dialect === 'mysql' ? '`' : dialect === 'sqlite' ? '"' : '"';
  return `${quote}${String(value).replaceAll(quote, quote + quote)}${quote}`;
}
function quoteValue(value, dialect = elements.dialect.value) {
  if (/^-?\d+(\.\d+)?$/.test(value.trim())) return value.trim();
  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return value.toLowerCase();
  return `'${value.replaceAll("'", "''")}'`;
}
function renderSchema() {
  const groups = [...new Set(Object.values(tables).map((table) => table.group))];
  elements.schemaList.innerHTML = groups.map((group) => {
    const names = Object.keys(tables).filter((name) => tables[name].group === group);
    return `<details class="schema-group" open><summary>${group}<span class="schema-table-count">${names.length}</span></summary>${names.map((name) => `<button class="table-nav ${name === state.table ? 'selected' : ''}" data-table="${name}"><span class="table-glyph">▦</span>${name}</button>`).join('')}</details>`;
  }).join('');
  elements.schemaList.querySelectorAll('[data-table]').forEach((button) => button.addEventListener('click', () => changeTable(button.dataset.table)));
  elements.tableSelect.innerHTML = Object.keys(tables).map((name) => `<option value="${name}">${tables[name].group}.${name}</option>`).join('');
  elements.tableSelect.value = state.table;
}
function changeTable(name) {
  state.table = name;
  state.selected = new Set(currentTable().columns.slice(0, Math.min(4, currentTable().columns.length)).map((column) => column.name));
  state.filters = [];
  state.sorts = [];
  elements.resultPanel.hidden = true;
  renderSchema(); renderColumns(); renderFilters(); renderSorts(); renderQuery();
}
function renderColumns() {
  elements.columnList.innerHTML = currentTable().columns.map((column) => `<label class="column-option ${state.selected.has(column.name) ? 'selected' : ''}"><input type="checkbox" value="${column.name}" ${state.selected.has(column.name) ? 'checked' : ''}><span class="column-name">${column.name}</span><span class="type-tag">${column.type}</span></label>`).join('');
  elements.columnList.querySelectorAll('input').forEach((input) => input.addEventListener('change', () => {
    input.checked ? state.selected.add(input.value) : state.selected.delete(input.value);
    input.closest('.column-option').classList.toggle('selected', input.checked);
    renderQuery();
  }));
  document.querySelector('#toggleColumns').textContent = state.selected.size === currentTable().columns.length ? 'Deselect all' : 'Select all';
}
function renderFilters() {
  const columns = currentTable().columns;
  elements.filterList.innerHTML = state.filters.map((filter) => {
    const column = columns.find((item) => item.name === filter.column) || columns[0];
    const operators = column.numeric || column.type === 'date' ? ['=', '!=', '>', '>=', '<', '<='] : ['=', '!=', 'contains', 'starts with'];
    const operator = operators.includes(filter.operator) ? filter.operator : operators[0];
    filter.column = column.name; filter.operator = operator;
    return `<div class="filter-row" data-filter="${filter.id}"><select class="filter-column" aria-label="Filter column">${columns.map((item) => `<option value="${item.name}" ${item.name === filter.column ? 'selected' : ''}>${item.name}</option>`).join('')}</select><select class="filter-operator" aria-label="Filter operator">${operators.map((item) => `<option value="${item}" ${item === filter.operator ? 'selected' : ''}>${item}</option>`).join('')}</select><input class="filter-value" aria-label="Filter value" placeholder="Value" value="${escapeHtml(filter.value)}"><button class="remove-row" aria-label="Remove filter" title="Remove filter">×</button></div>`;
  }).join('');
  elements.filterHint.hidden = state.filters.length > 0;
  elements.filterCount.textContent = state.filters.length ? `(${state.filters.length})` : '0';
  elements.filterList.querySelectorAll('.filter-row').forEach((row) => {
    const filter = state.filters.find((item) => item.id === Number(row.dataset.filter));
    row.querySelector('.filter-column').addEventListener('change', (event) => { filter.column = event.target.value; filter.operator = '='; renderFilters(); renderQuery(); });
    row.querySelector('.filter-operator').addEventListener('change', (event) => { filter.operator = event.target.value; renderQuery(); });
    row.querySelector('.filter-value').addEventListener('input', (event) => { filter.value = event.target.value; renderQuery(); });
    row.querySelector('.remove-row').addEventListener('click', () => { state.filters = state.filters.filter((item) => item.id !== filter.id); renderFilters(); renderQuery(); });
  });
}
function renderSorts() {
  const columns = currentTable().columns;
  elements.sortList.innerHTML = state.sorts.map((sort) => `<div class="sort-row" data-sort="${sort.id}"><select class="sort-column" aria-label="Sort column">${columns.map((item) => `<option value="${item.name}" ${item.name === sort.column ? 'selected' : ''}>${item.name}</option>`).join('')}</select><select class="sort-direction" aria-label="Sort direction"><option value="ASC" ${sort.direction === 'ASC' ? 'selected' : ''}>Ascending</option><option value="DESC" ${sort.direction === 'DESC' ? 'selected' : ''}>Descending</option></select><button class="remove-row" aria-label="Remove sort" title="Remove sort">×</button></div>`).join('');
  elements.sortHint.hidden = state.sorts.length > 0;
  elements.sortList.querySelectorAll('.sort-row').forEach((row) => {
    const sort = state.sorts.find((item) => item.id === Number(row.dataset.sort));
    row.querySelector('.sort-column').addEventListener('change', (event) => { sort.column = event.target.value; renderQuery(); });
    row.querySelector('.sort-direction').addEventListener('change', (event) => { sort.direction = event.target.value; renderQuery(); });
    row.querySelector('.remove-row').addEventListener('click', () => { state.sorts = state.sorts.filter((item) => item.id !== sort.id); renderSorts(); renderQuery(); });
  });
}
function buildSql() {
  const dialect = elements.dialect.value;
  const columns = state.selected.size ? [...state.selected].map(escapeIdentifier).join(', ') : '*';
  const lines = [`SELECT ${columns}`, `FROM ${escapeIdentifier(state.table)}`];
  const filters = state.filters.filter((filter) => filter.value.trim());
  if (filters.length) {
    const clauses = filters.map((filter) => {
      const column = escapeIdentifier(filter.column);
      const value = quoteValue(filter.value, dialect);
      if (filter.operator === 'contains') return `${column} LIKE ${quoteValue(`%${filter.value}%`, dialect)}`;
      if (filter.operator === 'starts with') return `${column} LIKE ${quoteValue(`${filter.value}%`, dialect)}`;
      return `${column} ${filter.operator} ${value}`;
    });
    lines.push(`WHERE ${clauses.join('\n  AND ')}`);
  }
  if (state.sorts.length) lines.push(`ORDER BY ${state.sorts.map((sort) => `${escapeIdentifier(sort.column)} ${sort.direction}`).join(', ')}`);
  const limit = Math.max(1, Math.min(100000, Number(elements.limit.value) || 100));
  lines.push(`LIMIT ${limit};`);
  return lines.join('\n');
}
function highlightSql(sql) {
  const tokens = sql.match(/'(?:''|[^'])*'|"(?:""|[^"])*"|`(?:``|[^`])*`|\b(?:SELECT|FROM|WHERE|AND|OR|ORDER BY|ASC|DESC|LIMIT|LIKE)\b|\b(?:COUNT|SUM|AVG|MIN|MAX)\b|\b\d+(?:\.\d+)?\b/gi) || [];
  let output = ''; let offset = 0;
  for (const token of tokens) {
    const index = sql.indexOf(token, offset);
    output += escapeHtml(sql.slice(offset, index));
    const cls = /^['"`]/.test(token) ? (/^\d/.test(token) ? 'sql-number' : 'sql-identifier') : /^\d/.test(token) ? 'sql-number' : /^(COUNT|SUM|AVG|MIN|MAX)$/i.test(token) ? 'sql-function' : 'sql-keyword';
    output += `<span class="${cls}">${escapeHtml(token)}</span>`;
    offset = index + token.length;
  }
  return output + escapeHtml(sql.slice(offset));
}
function renderQuery() {
  const sql = buildSql();
  elements.preview.innerHTML = highlightSql(sql);
  const lineTotal = sql.split('\n').length;
  elements.lines.textContent = Array.from({ length: lineTotal }, (_, index) => index + 1).join('\n');
  elements.lineCount.textContent = `${lineTotal} ${lineTotal === 1 ? 'line' : 'lines'}`;
  elements.rowEstimate.textContent = `LIMIT ${Math.max(1, Number(elements.limit.value) || 100)}`;
  renderColumns();
}
function escapeHtml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function showToast(message) { elements.toast.textContent = message; elements.toast.classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => elements.toast.classList.remove('show'), 2100); }
function compareValues(left, operator, right) {
  const a = Number(left); const b = Number(right);
  const numeric = String(left).trim() !== '' && String(right).trim() !== '' && Number.isFinite(a) && Number.isFinite(b);
  const first = numeric ? a : String(left).toLowerCase(); const second = numeric ? b : String(right).toLowerCase();
  switch (operator) {
    case '=': return first === second;
    case '!=': return first !== second;
    case '>': return first > second;
    case '>=': return first >= second;
    case '<': return first < second;
    case '<=': return first <= second;
    case 'contains': return String(left).toLowerCase().includes(String(right).toLowerCase());
    case 'starts with': return String(left).toLowerCase().startsWith(String(right).toLowerCase());
    default: return true;
  }
}
function runQuery() {
  const visibleColumns = state.selected.size ? [...state.selected] : currentTable().columns.map((column) => column.name);
  const filters = state.filters.filter((filter) => filter.value.trim());
  let rows = currentTable().rows.filter((row) => filters.every((filter) => compareValues(row[filter.column], filter.operator, filter.value)));
  if (state.sorts.length) rows.sort((first, second) => {
    for (const sort of state.sorts) {
      const a = first[sort.column]; const b = second[sort.column];
      const result = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
      if (result) return sort.direction === 'ASC' ? result : -result;
    }
    return 0;
  });
  rows = rows.slice(0, Math.max(1, Number(elements.limit.value) || 100));
  elements.resultContent.innerHTML = rows.length ? `<table><thead><tr>${visibleColumns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${visibleColumns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<div class="empty-hint">No rows match these filters.</div>';
  elements.resultPanel.hidden = false;
  showToast(`${rows.length} ${rows.length === 1 ? 'row' : 'rows'} returned from sample data`);
}

elements.tableSelect.addEventListener('change', () => changeTable(elements.tableSelect.value));
document.querySelector('#addFilter').addEventListener('click', () => { const column = currentTable().columns[0]; state.filters.push({ id: ++state.filterId, column: column.name, operator: '=', value: '' }); renderFilters(); renderQuery(); });
document.querySelector('#addSort').addEventListener('click', () => { const column = currentTable().columns[0]; state.sorts.push({ id: ++state.sortId, column: column.name, direction: 'ASC' }); renderSorts(); renderQuery(); });
document.querySelector('#toggleColumns').addEventListener('click', () => { state.selected.size === currentTable().columns.length ? state.selected.clear() : currentTable().columns.forEach((column) => state.selected.add(column.name)); renderColumns(); renderQuery(); });
elements.limit.addEventListener('input', renderQuery);
elements.dialect.addEventListener('change', renderQuery);
document.querySelector('#resetQuery').addEventListener('click', () => { state.selected = new Set(currentTable().columns.slice(0, Math.min(4, currentTable().columns.length)).map((column) => column.name)); state.filters = []; state.sorts = []; elements.limit.value = 100; renderColumns(); renderFilters(); renderSorts(); renderQuery(); elements.resultPanel.hidden = true; showToast('Query reset'); });
document.querySelector('#refreshSchema').addEventListener('click', () => { renderSchema(); showToast('Sample schema refreshed'); });
document.querySelector('#copyQuery').addEventListener('click', async () => { try { await navigator.clipboard.writeText(buildSql()); showToast('SQL copied to clipboard'); } catch { showToast('Clipboard access is unavailable in this browser'); } });
document.querySelector('#runQuery').addEventListener('click', runQuery);
document.querySelector('#closeResults').addEventListener('click', () => { elements.resultPanel.hidden = true; });
document.querySelector('#saveQuery').addEventListener('click', () => { const name = `Query ${String(state.saved.length + 1).padStart(2, '0')}`; state.saved.push({ name, sql: buildSql() }); document.querySelector('#savedCount').textContent = state.saved.length; showToast(`${name} saved to this session`); });
document.querySelector('#savedNav').addEventListener('click', () => { showToast(state.saved.length ? state.saved.map((query) => query.name).join(', ') : 'No saved queries in this session'); });
document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') runQuery(); });

renderSchema(); renderColumns(); renderFilters(); renderSorts(); renderQuery();
