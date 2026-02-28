export class ResponsiveTableCards {
  constructor(options = {}) {
    this.breakpoint = Number(options.breakpoint || 768);
    this.tableConfigs = options.tableConfigs || {};
    this.registry = new Map();
  }

  registerAll(root = document) {
    root.querySelectorAll("table.data-table").forEach((table) => this.registerTable(table));
  }

  registerTable(table) {
    if (!(table instanceof HTMLTableElement)) return null;
    const tbody = table.tBodies?.[0];
    if (!tbody || !tbody.id) return null;

    const existing = this.registry.get(tbody.id);
    if (existing) return existing;

    table.classList.add("responsive-table-enhanced");
    const headers = this.#extractHeaders(table);
    const config = this.#resolveConfig(tbody.id, headers);
    const cardsHost = this.#ensureCardsHost(table, tbody.id);

    const entry = { table, tbody, headers, config, cardsHost };
    this.registry.set(tbody.id, entry);
    this.sync(tbody.id);
    return entry;
  }

  registerTableById(tbodyId) {
    if (!tbodyId) return null;
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return null;
    const table = tbody.closest("table.data-table");
    if (!table) return null;
    return this.registerTable(table);
  }

  getCardsContainer(tbodyId) {
    return this.registry.get(tbodyId)?.cardsHost || null;
  }

  sync(tbodyId) {
    const entry = this.registry.get(tbodyId) || this.registerTableById(tbodyId);
    if (!entry) return;

    const { tbody, cardsHost, headers, config } = entry;
    cardsHost.innerHTML = "";

    Array.from(tbody.querySelectorAll("tr")).forEach((row) => {
      const card = this.#buildCard(row, headers, config);
      if (card) cardsHost.appendChild(card);
    });
  }

  #extractHeaders(table) {
    const headerCells = Array.from(table.querySelectorAll("thead th"));
    return headerCells.map((cell, index) => {
      const label = this.#normalizeWhitespace(cell.textContent || "");
      return label || `Column ${index + 1}`;
    });
  }

  #resolveConfig(tbodyId, headers) {
    const config = this.tableConfigs[tbodyId] || {};

    const actionsIndex = this.#resolveColumnIndex(headers, config.actionsField || "Actions");

    let titleIndex = this.#resolveColumnIndex(headers, config.titleField);
    if (titleIndex < 0) {
      titleIndex = headers.findIndex((_, idx) => idx !== actionsIndex);
    }

    let statusIndex = this.#resolveColumnIndex(headers, config.statusField);
    if (statusIndex < 0 && config.autoStatus !== false) {
      statusIndex = headers.findIndex((header, idx) => {
        if (idx === actionsIndex || idx === titleIndex) return false;
        const normalized = this.#normalizeKey(header);
        return normalized === "status" || normalized === "payment status";
      });
    }

    if (statusIndex === titleIndex || statusIndex === actionsIndex) {
      statusIndex = -1;
    }

    const primaryFieldOrder = Array.isArray(config.primaryFields)
      ? config.primaryFields
        .map((field) => this.#resolveColumnIndex(headers, field))
        .filter((idx, pos, arr) => idx >= 0 && arr.indexOf(idx) === pos)
      : [];

    return {
      titleIndex,
      statusIndex,
      actionsIndex,
      primaryFieldOrder,
      emptyPlaceholder: config.emptyPlaceholder || "--"
    };
  }

  #resolveColumnIndex(headers, field) {
    if (typeof field === "number" && Number.isInteger(field)) {
      return field >= 0 && field < headers.length ? field : -1;
    }
    if (!field || typeof field !== "string") return -1;

    const target = this.#normalizeKey(field);
    let index = headers.findIndex((header) => this.#normalizeKey(header) === target);
    if (index >= 0) return index;

    index = headers.findIndex((header) => this.#normalizeKey(header).includes(target));
    return index;
  }

  #ensureCardsHost(table, tbodyId) {
    const wrapper = table.closest(".table-section") || table.parentElement;
    if (!wrapper) return document.createElement("div");

    let cardsHost = wrapper.querySelector(`.responsive-table-cards[data-responsive-cards-for="${tbodyId}"]`);
    if (!cardsHost) {
      cardsHost = document.createElement("div");
      cardsHost.className = "responsive-table-cards";
      cardsHost.setAttribute("data-responsive-cards-for", tbodyId);
      cardsHost.setAttribute("role", "list");
      cardsHost.setAttribute("aria-live", "polite");
      table.insertAdjacentElement("afterend", cardsHost);
    }

    return cardsHost;
  }

  #buildCard(row, headers, config) {
    if (!(row instanceof HTMLTableRowElement)) return null;

    const cells = Array.from(row.children).filter((cell) => cell instanceof HTMLTableCellElement);
    if (!cells.length) return null;

    const firstCell = cells[0];
    if (firstCell?.classList.contains("empty-row")) {
      const emptyCard = document.createElement("article");
      emptyCard.className = "responsive-row-card responsive-row-card--empty";
      emptyCard.textContent = this.#normalizeWhitespace(firstCell.textContent || "") || config.emptyPlaceholder;
      return emptyCard;
    }

    const titleIndex = this.#safeIndex(config.titleIndex, cells.length);
    const actionsIndex = this.#safeIndex(config.actionsIndex, cells.length);
    let statusIndex = this.#safeIndex(config.statusIndex, cells.length);

    if (statusIndex < 0) {
      statusIndex = cells.findIndex((cell, idx) => {
        if (idx === actionsIndex || idx === titleIndex) return false;
        return Boolean(cell.querySelector(".status-badge"));
      });
    }

    const card = document.createElement("article");
    card.className = "responsive-row-card";
    card.setAttribute("role", "listitem");

    const header = document.createElement("header");
    header.className = "responsive-row-card__header";

    const title = document.createElement("h3");
    title.className = "responsive-row-card__title";
    this.#appendClonedContent(title, cells[titleIndex], config.emptyPlaceholder);
    header.appendChild(title);

    if (statusIndex >= 0) {
      const statusWrap = document.createElement("div");
      statusWrap.className = "responsive-row-card__status";

      const statusBadge = cells[statusIndex]?.querySelector(".status-badge");
      if (statusBadge) {
        statusWrap.appendChild(statusBadge.cloneNode(true));
      } else {
        this.#appendClonedContent(statusWrap, cells[statusIndex], "");
      }

      if (this.#hasVisibleContent(statusWrap)) {
        header.appendChild(statusWrap);
      }
    }

    card.appendChild(header);

    const bodyGrid = document.createElement("dl");
    bodyGrid.className = "responsive-row-card__grid";

    const orderedFieldIndexes = [];
    const seenIndexes = new Set();
    const includeField = (index) => {
      if (index === actionsIndex || index === titleIndex || index === statusIndex) return;
      if (index < 0 || index >= cells.length || seenIndexes.has(index)) return;
      seenIndexes.add(index);
      orderedFieldIndexes.push(index);
    };

    config.primaryFieldOrder.forEach((idx) => includeField(this.#safeIndex(idx, cells.length)));
    cells.forEach((_, index) => includeField(index));

    orderedFieldIndexes.forEach((index) => {
      const fieldLabel = headers[index] || `Column ${index + 1}`;
      const item = this.#createFieldItem(fieldLabel);
      const value = item.querySelector(".responsive-row-card__value");
      this.#appendClonedContent(value, cells[index], config.emptyPlaceholder);
      if (this.#isWideField(fieldLabel, value.textContent || "")) {
        item.classList.add("responsive-row-card__field--wide");
      }
      bodyGrid.appendChild(item);
    });

    const extraFields = this.#parseExtraFields(row.dataset.mobileExtra);
    extraFields.forEach((field) => {
      const item = this.#createFieldItem(field.label || "Details");
      const value = item.querySelector(".responsive-row-card__value");
      value.textContent = this.#normalizeWhitespace(field.value || "") || config.emptyPlaceholder;
      if (this.#isWideField(field.label, field.value)) {
        item.classList.add("responsive-row-card__field--wide");
      }
      bodyGrid.appendChild(item);
    });

    if (bodyGrid.children.length) {
      card.appendChild(bodyGrid);
    }

    if (actionsIndex >= 0) {
      const actionsFooter = document.createElement("footer");
      actionsFooter.className = "responsive-row-card__actions";
      this.#appendClonedContent(actionsFooter, cells[actionsIndex], "");
      if (this.#hasVisibleContent(actionsFooter)) {
        card.appendChild(actionsFooter);
      }
    }

    return card;
  }

  #appendClonedContent(target, sourceCell, fallbackText = "--") {
    if (!target) return;

    target.innerHTML = "";
    if (!(sourceCell instanceof HTMLTableCellElement)) {
      target.textContent = fallbackText;
      return;
    }

    const nodes = Array.from(sourceCell.childNodes).map((node) => node.cloneNode(true));
    nodes.forEach((node) => target.appendChild(node));

    if (!this.#hasVisibleContent(target)) {
      target.textContent = fallbackText;
    }
  }

  #hasVisibleContent(element) {
    if (!element) return false;
    if (element.querySelector("button, a, .status-badge, i, svg")) return true;
    return this.#normalizeWhitespace(element.textContent || "") !== "";
  }

  #safeIndex(index, length) {
    if (!Number.isInteger(index)) return -1;
    return index >= 0 && index < length ? index : -1;
  }

  #normalizeWhitespace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  #normalizeKey(value) {
    return this.#normalizeWhitespace(value).toLowerCase();
  }

  #parseExtraFields(raw) {
    if (!raw) return [];

    try {
      const decoded = decodeURIComponent(raw);
      const parsed = JSON.parse(decoded);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => ({
          label: this.#normalizeWhitespace(item?.label || ""),
          value: this.#normalizeWhitespace(item?.value || "")
        }))
        .filter((item) => item.label || item.value);
    } catch (error) {
      return [];
    }
  }

  #createFieldItem(labelText) {
    const item = document.createElement("div");
    item.className = "responsive-row-card__field";

    const label = document.createElement("dt");
    label.className = "responsive-row-card__label";
    label.textContent = this.#normalizeWhitespace(labelText || "") || "Details";

    const value = document.createElement("dd");
    value.className = "responsive-row-card__value";

    item.append(label, value);
    return item;
  }

  #isWideField(label, value) {
    const normalizedLabel = this.#normalizeKey(label);
    const normalizedValue = this.#normalizeWhitespace(value);
    if (
      normalizedLabel.includes("description")
      || normalizedLabel.includes("note")
      || normalizedLabel.includes("address")
    ) {
      return true;
    }
    return normalizedValue.length > 80;
  }
}
