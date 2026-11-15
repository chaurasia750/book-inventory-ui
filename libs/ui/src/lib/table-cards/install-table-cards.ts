/** A cell that shows nothing: no text and nothing to click, type in or look at (platform U18: an empty cell is left out of a card). */
const INTERACTIVE = 'input,select,textarea,button,a,svg,img';

/** The class the shared style sheet (`styles/table-cards.scss`) lays out as cards under 768 px. */
const CARD_CLASS = 'table-cards';

/** A table that must stay a table on every screen says so with `data-cards="off"`. */
const OPT_OUT_ATTRIBUTE = 'data-cards';

function headerLabels(table: HTMLTableElement): string[] {
  const headerRows = table.tHead?.rows;
  const headerRow = headerRows && headerRows.length > 0 ? headerRows[headerRows.length - 1] : null;
  const labels: string[] = [];
  for (const cell of Array.from(headerRow?.cells ?? [])) {
    const text = (cell.textContent ?? '').trim();
    for (let span = 0; span < Math.max(cell.colSpan, 1); span++) {
      labels.push(text);
    }
  }

  return labels;
}

function setAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) {
    if (element.hasAttribute(name)) {
      element.removeAttribute(name);
    }
  } else if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

function isEmptyCell(cell: HTMLTableCellElement): boolean {
  return (cell.textContent ?? '').trim() === '' && cell.querySelector(INTERACTIVE) === null;
}

function decorateRow(row: HTMLTableRowElement, labels: string[]): void {
  let column = 0;
  for (const cell of Array.from(row.cells)) {
    const label = cell.colSpan === 1 ? (labels[column] ?? '') : '';
    setAttribute(cell, 'data-label', label);
    setAttribute(cell, 'data-empty', isEmptyCell(cell) ? '' : null);
    column += Math.max(cell.colSpan, 1);
  }
}

/** Platform U18: gives every body cell the text of its column header, so a phone can show it as a labelled line of a card. */
function decorateTable(table: HTMLTableElement): void {
  if (table.getAttribute(OPT_OUT_ATTRIBUTE) === 'off') {
    return;
  }

  table.classList.add(CARD_CLASS);
  const labels = headerLabels(table);
  for (const body of Array.from(table.tBodies)) {
    for (const row of Array.from(body.rows)) {
      decorateRow(row, labels);
    }
  }
}

function tablesOf(node: Node): HTMLTableElement[] {
  if (node instanceof HTMLTableElement) {
    return [node];
  }

  const element = node instanceof Element ? node : node.parentElement;
  if (!element) {
    return [];
  }

  const inside = Array.from(element.querySelectorAll('table'));
  const around = element.closest('table');
  return around ? [around, ...inside] : inside;
}

/**
 * Platform U18, one shared mechanism for the whole application: every table is marked as a card table and its body cells get the
 * header text as their label (`data-label`). The style sheet turns the rows into cards under 768 px; from 768 px up nothing
 * changes. Tables appear and change while the application runs, so the page is watched once and only the tables that changed are
 * decorated again, on the next animation frame.
 */
export function installTableCards(): void {
  const pending = new Set<HTMLTableElement>();
  let scheduled = false;

  const flush = (): void => {
    scheduled = false;
    const tables = Array.from(pending);
    pending.clear();
    tables.forEach(decorateTable);
  };

  const queue = (nodes: Iterable<Node>): void => {
    for (const node of nodes) {
      tablesOf(node).forEach((table) => pending.add(table));
    }

    if (pending.size > 0 && !scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      queue([record.target, ...Array.from(record.addedNodes)]);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  queue([document.body]);
}
