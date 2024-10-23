class MultipleSelectHierarchy {
  constructor(selectElement, options = {}) {
    this.selectElement = selectElement;
    this.id = `msh-${Math.random().toString(36).slice(2, 9)}`;
    this.options = {
      maxSelections: 3,
      placeholder: "Please select",
      searchPlaceholder: "Search",
      allText: "All",
      clearAllText: "Clear all",
      selectedText: "You have selected {n} items",
      maxSelectionsMessage: "You can only select up to {n} items.",
      ...options,
    };
    this.items = [];
    this.selectedItems = {};

    this.init();
  }

  init() {
    this.parseSelectOptions();
    this.render();
    this.attachEventListeners();
    this.updateInput();
  }

  parseSelectOptions() {
    const options = this.selectElement.children;
    this.items = [];
    let currentParent = null;

    for (let element of options) {
      if (element.tagName === "OPTGROUP") {
        currentParent = {
          id: parseInt(element.dataset.value),
          name: element.getAttribute("label"),
          children: [],
        };
        this.items.push(currentParent);

        // Process children of the optgroup
        for (let child of element.children) {
          const childItem = {
            id: parseInt(child.value),
            name: child.textContent,
          };
          currentParent.children.push(childItem);
        }
      } else if (element.tagName === "OPTION") {
        // Top level option
        this.items.push({
          id: parseInt(element.value),
          name: element.textContent,
        });
      }
    }

  }

  render() {
    const container = document.createElement("div");
    container.className = "multiple-select-hierarchy";
    container.innerHTML = `
            <div class="dropdown">
                <div class="input-group">
                    <div class="form-control d-flex flex-wrap align-items-center" id="${this.id}-chips-container" tabindex="0">
                        <input type="text" class="border-0 flex-grow-1" id="${this.id}-input" placeholder="${this.options.placeholder}" readonly style="display: none;">
                    </div>
                    <input type="hidden" id="${this.id}-selected-items" name="${this.selectElement.name}">
                </div>
                <div class="card select-card" style="display: none;">
                    <div class="card-body">
                        <h5 class="card-title mb-3">${this.options.placeholder}</h5>
                        <div class="search-container">
                          <div class="search-input-wrapper">
                            <i class="search-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            </i>
                            <input type="text" class="search-input" placeholder="${this.options.searchPlaceholder}" id="${this.id}-search-input">
                          </div>
                        </div>
                        <div id="${this.id}-selection-info" class="mb-2 text-muted"></div>
                        <ul class="list-group" id="${this.id}-item-list"></ul>
                    </div>
                </div>
            </div>
        `;

    this.selectElement.parentNode.insertBefore(
      container,
      this.selectElement.nextSibling
    );
    this.selectElement.style.display = "none";

    this.container = container;
    this.chipsContainer = container.querySelector(
      `#${this.id}-chips-container`
    );
    this.input = container.querySelector(`#${this.id}-input`);
    this.selectedItemsInput = container.querySelector(
      `#${this.id}-selected-items`
    );
    this.selectCard = container.querySelector(".select-card");
    this.searchInput = container.querySelector(`#${this.id}-search-input`);
    this.selectionInfo = container.querySelector(`#${this.id}-selection-info`);
    this.itemList = container.querySelector(`#${this.id}-item-list`);
  }

  attachEventListeners() {
    this.chipsContainer.addEventListener("click", () => {
      this.chipsContainer.focus();
      this.showSelectCard();
    });

    this.chipsContainer.addEventListener("focus", () => {
      this.chipsContainer.classList.add("focused");
    });

    this.chipsContainer.addEventListener("blur", () => {
      this.chipsContainer.classList.remove("focused");
    });

    document.addEventListener("click", (e) => {
      if (
        !this.selectCard.contains(e.target) &&
        !this.chipsContainer.contains(e.target)
      ) {
        this.hideSelectCard();
      }
    });
    this.selectCard.addEventListener("click", (e) => e.stopPropagation());
    this.searchInput.addEventListener("input", (e) =>
      this.handleSearch(e.target.value)
    );
  }

  setItems(items) {
    this.items = items;
    this.renderItems(this.items);
  }

  renderItems(items) {
    this.itemList.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between align-items-center";
      const isChecked = this.selectedItems[item.id] !== undefined;
      const isDisabled =
        !isChecked &&
        Object.keys(this.selectedItems).length >= this.options.maxSelections;

      const hasChildren = item.children && item.children.length > 0;

      li.innerHTML = `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="${this.id}-item-${
        item.id
      }" 
            ${isChecked ? "checked" : ""} ${isDisabled ? "disabled" : ""}>
          <label class="form-check-label" for="${this.id}-item-${item.id}">${
        item.name
      }</label>
        </div>
        ${
          hasChildren
            ? `<button class="btn btn-link p-0" ${isDisabled ? "disabled" : ""}>
                 <i class="${
                   isDisabled ? "text-muted" : ""
                 }">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m9 18 6-6-6-6"/></svg>
                 </i>
               </button>`
            : ""
        }
      `;

      li.querySelector("input").addEventListener("change", (e) =>
        this.handleItemSelection(item, e.target.checked)
      );

      if (hasChildren) {
        li.querySelector("button").addEventListener("click", (e) => {
          if (!isDisabled) {
            this.handleItemClick(item);
          }
        });
      }

      this.itemList.appendChild(li);
    });
    this.updateSelectionInfo();
  }

  renderChildren(parent) {
    this.itemList.innerHTML = "";

    if (parent.children && parent.children.length > 0) {
      this.itemList.innerHTML = `
        <li class="list-group-item">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="${this.id}-allChildren">
            <label class="form-check-label" for="${this.id}-allChildren">${this.options.allText}</label>
          </div>
        </li>
      `;

      const allChildrenSelected = this.selectedItems[parent.id] === null;

      parent.children.forEach((child) => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        const isChecked =
          allChildrenSelected ||
          (this.selectedItems[parent.id] &&
            this.selectedItems[parent.id].includes(child.id));
        li.innerHTML = `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="${
              this.id
            }-child-${child.id}" 
              ${isChecked ? "checked" : ""} ${
          allChildrenSelected ? "disabled" : ""
        }>
            <label class="form-check-label" for="${this.id}-child-${
          child.id
        }">${child.name}</label>
          </div>
        `;
        li.querySelector("input").addEventListener("change", (e) =>
          this.handleChildSelection(parent, child, e.target.checked)
        );
        this.itemList.appendChild(li);
      });

      const allChildrenCheckbox = this.itemList.querySelector(
        `#${this.id}-allChildren`
      );
      allChildrenCheckbox.checked = allChildrenSelected;
      allChildrenCheckbox.addEventListener("change", (e) =>
        this.handleAllChildrenSelection(parent, e.target.checked)
      );
    } else {
      // If the item doesn't have children, just display it as a single item
      this.renderItems([parent]);
    }
  }

  handleItemSelection(item, isChecked) {
    const selectedParentCount = Object.keys(this.selectedItems).length;
    const isNewSelection = !this.selectedItems[item.id];

    if (isChecked) {
      if (isNewSelection && selectedParentCount >= this.options.maxSelections) {
        alert(
          this.options.maxSelectionsMessage.replace(
            "{n}",
            this.options.maxSelections
          )
        );
        // Prevent the checkbox from being checked
        setTimeout(() => {
          const checkbox = document.getElementById(
            `${this.id}-item-${item.id}`
          );
          if (checkbox) checkbox.checked = false;
        }, 0);
        return false;
      }
      this.selectedItems[item.id] = null;
    } else {
      delete this.selectedItems[item.id];
    }
    this.updateInput();
    this.updateSelectionInfo();
    this.renderItems(this.items);
    this.updateSelectedValuesDisplay();
    return true;
  }

  handleChildSelection(parent, child, isChecked) {
    const selectedParentCount = Object.keys(this.selectedItems).length;
    const isNewParentSelection = !this.selectedItems[parent.id];

    if (
      isNewParentSelection &&
      selectedParentCount >= this.options.maxSelections
    ) {
      alert(
        this.options.maxSelectionsMessage.replace(
          "{n}",
          this.options.maxSelections
        )
      );
      setTimeout(() => {
        const checkbox = document.getElementById(
          `${this.id}-child-${child.id}`
        );
        if (checkbox) checkbox.checked = false;
      }, 0);
      return;
    }

    if (!this.selectedItems[parent.id]) {
      this.selectedItems[parent.id] = [];
    }

    if (isChecked) {
      if (!this.selectedItems[parent.id].includes(child.id)) {
        this.selectedItems[parent.id].push(child.id);
      }
    } else {
      this.selectedItems[parent.id] = this.selectedItems[parent.id].filter(
        (id) => id !== child.id
      );
    }

    if (this.selectedItems[parent.id].length === 0) {
      delete this.selectedItems[parent.id];
    } else if (
      this.selectedItems[parent.id].length === parent.children.length
    ) {
      this.selectedItems[parent.id] = null;
    }

    this.updateInput();
    this.updateSelectionInfo();
    this.renderChildren(parent);
    this.updateSelectedValuesDisplay();
  }

  handleAllChildrenSelection(parent, isChecked) {
    const selectedParentCount = Object.keys(this.selectedItems).length;
    const isNewParentSelection = !this.selectedItems[parent.id];

    if (
      isChecked &&
      isNewParentSelection &&
      selectedParentCount >= this.options.maxSelections
    ) {
      alert(
        this.options.maxSelectionsMessage.replace(
          "{n}",
          this.options.maxSelections
        )
      );
      // Prevent the "All" checkbox from being checked
      setTimeout(() => {
        const checkbox = document.getElementById(`${this.id}-allChildren`);
        if (checkbox) checkbox.checked = false;
      }, 0);
      return;
    }

    if (isChecked) {
      this.selectedItems[parent.id] = null;
    } else {
      delete this.selectedItems[parent.id];
    }
    this.updateInput();
    this.updateSelectionInfo();
    this.renderChildren(parent);
    this.updateSelectedValuesDisplay();
  }

  handleItemClick(item) {
    this.selectedParent = item;
    this.searchInput.value = "";
    this.renderChildren(item);
    this.updateSelectionInfo();
    this.updateHeader(item.name, true);
  }

  handleBackClick() {
    this.selectedParent = null;
    this.updateHeader(this.options.placeholder);
    this.searchInput.value = "";
    this.renderItems(this.items);
  }

  handleSearch(searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    const filteredItems = this.items
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter((child) =>
              child.name.toLowerCase().includes(searchLower)
            ),
          };
        }
        return item.name.toLowerCase().includes(searchLower) ? item : null;
      })
      .filter(
        (item) => item !== null && (!item.children || item.children.length > 0)
      );

    this.renderItems(filteredItems);
  }

  showSelectCard() {
    this.selectCard.style.display = "block";
    this.updateHeader(this.options.placeholder);
    this.renderItems(this.items);
  }

  hideSelectCard() {
    this.selectCard.style.display = "none";
  }

  updateInput() {
    this.chipsContainer.innerHTML = "";
    const selectedItems = Object.entries(this.selectedItems)
      .map(([itemId, childrenIds]) => {
        const item = this.items.find((i) => i.id.toString() === itemId);
        if (item) {
          if (
            childrenIds === null ||
            (Array.isArray(childrenIds) &&
              childrenIds.length === item.children?.length)
          ) {
            return this.createChip(item.name, itemId);
          } else {
            return this.createChip(
              `${item.name} (${childrenIds.length})`,
              itemId
            );
          }
        }
        return null;
      })
      .filter((chip) => chip !== null);

    if (selectedItems.length === 0) {
      const placeholderSpan = document.createElement("span");
      placeholderSpan.textContent = this.options.placeholder;
      placeholderSpan.className = "placeholder-text";
      this.chipsContainer.appendChild(placeholderSpan);
    } else {
      this.renderChips(selectedItems);
    }

    this.selectedItemsInput.value = JSON.stringify(
      this.getSelectedValuesArray()
    );
  }

  renderChips(chips) {
    const containerWidth = this.chipsContainer.offsetWidth;
    const chipMargin = 4;
    const chipPadding = 8;
    const containerPadding = 12;
    const closeButtonWidth = 16;
    const availableWidth = containerWidth - containerPadding;

    let totalChipsWidth = 0;
    const chipWidths = [];

    // First pass: calculate total width and individual chip widths
    chips.forEach((chip) => {
      this.chipsContainer.appendChild(chip);
      const chipWidth = chip.offsetWidth + chipMargin;
      totalChipsWidth += chipWidth;
      chipWidths.push(chipWidth);
      this.chipsContainer.removeChild(chip);
    });

    // If total width exceeds available width, adjust chip widths
    if (totalChipsWidth > availableWidth) {
      const scaleFactor = availableWidth / totalChipsWidth;
      let currentLineWidth = 0;

      chips.forEach((chip, index) => {
        const newWidth =
          Math.floor(chipWidths[index] * scaleFactor) - chipMargin;
        this.adjustChipWidth(chip, newWidth, closeButtonWidth, chipPadding);
        currentLineWidth += newWidth + chipMargin;

        // Ensure we don't exceed the available width due to rounding
        if (index === chips.length - 1 && currentLineWidth > availableWidth) {
          const finalAdjustment = currentLineWidth - availableWidth;
          this.adjustChipWidth(
            chip,
            newWidth - finalAdjustment,
            closeButtonWidth,
            chipPadding
          );
        }

        this.chipsContainer.appendChild(chip);
      });
    } else {
      // If total width doesn't exceed available width, use original sizes
      chips.forEach((chip) => {
        this.chipsContainer.appendChild(chip);
      });
    }
  }

  adjustChipWidth(chip, width, closeButtonWidth, chipPadding) {
    const minWidth = 30;

    width = Math.max(width, minWidth);

    chip.style.width = `${width}px`;
    chip.style.flex = "0 0 auto";
    const chipText = chip.querySelector(".chip-text");
    chipText.style.width = `${width - closeButtonWidth - chipPadding}px`;
    chipText.style.overflow = "hidden";
    chipText.style.textOverflow = "ellipsis";
  }

  createChip(text, id) {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `
      <span class="chip-text" title="${text}">${text}</span>
      <span class="close">&times;</span>
    `;
    chip.querySelector(".close").addEventListener("click", (e) => {
      e.stopPropagation();
      this.removeSelection(id);
    });
    return chip;
  }

  removeSelection(id) {
    delete this.selectedItems[id];
    this.updateInput();
    this.updateSelectionInfo();
    this.renderItems(this.items);
    this.updateSelectedValuesDisplay();
  }

  updateHeader(title, showBackButton = false) {
    const cardBody = this.selectCard.querySelector(".card-body");
    const existingHeader = cardBody.querySelector("h5.card-title");

    if (existingHeader) {
      existingHeader.remove();
    }

    const header = document.createElement("h5");
    header.className = "card-title mt-0 d-flex align-items-center";

    if (showBackButton) {
      const backButton = document.createElement("i");
      backButton.className = "me-2";
      backButton.style.cursor = "pointer";
      backButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m15 18-6-6 6-6"/></svg>`;
      backButton.addEventListener("click", this.handleBackClick.bind(this));
      header.appendChild(backButton);
    }

    header.appendChild(document.createTextNode(title));
    cardBody.insertBefore(header, cardBody.firstChild);
  }

  updateSelectionInfo() {
    const selectionInfo = this.selectionInfo;
    const selectedCount = Object.keys(this.selectedItems).length;
    if (selectedCount > 0) {
      selectionInfo.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span>${this.options.selectedText.replace(
                      "{n}",
                      selectedCount
                    )}</span>
                    <a href="#" class="text-primary text-decoration-none" id="${
                      this.id
                    }-clear-all">${this.options.clearAllText}</a>
                </div>
            `;
      const clearAllButton = selectionInfo.querySelector(
        `#${this.id}-clear-all`
      );
      clearAllButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.clearAll();
      });
    } else {
      selectionInfo.innerHTML = "";
    }
  }

  clearAll() {
    Object.keys(this.selectedItems).forEach(
      (key) => delete this.selectedItems[key]
    );
    this.renderItems(this.items);
    this.updateInput();
    this.updateSelectionInfo();
  }

  updateSelectedValuesDisplay() {
    const selectedValues = this.getSelectedValuesArray();

    const event = new CustomEvent("selectionChange", {
      detail: {
        id: this.selectElement.id,
        selectedItems: selectedValues,
      },
    });
    this.selectElement.dispatchEvent(event);

    // Update the original select element
    Array.from(this.selectElement.options).forEach((option) => {
      const optionId = parseInt(option.value);
      const isSelected = selectedValues.some(
        (item) =>
          item.id === optionId ||
          (item.children && item.children.includes(optionId)) ||
          this.items.find(
            (parent) =>
              parent.id === item.id &&
              parent.children?.some((child) => child.id === optionId)
          )
      );
      option.selected = isSelected;
    });

    // Update the hidden input
    this.selectedItemsInput.value = JSON.stringify(selectedValues);
  }

  getSelectedValuesArray() {
    const selectedValues = [];
    Object.entries(this.selectedItems).forEach(([parentId, childrenIds]) => {
      const parent = this.items.find((item) => item.id === parseInt(parentId));
      if (parent) {
        if (
          childrenIds === null ||
          (Array.isArray(childrenIds) &&
            childrenIds.length === parent.children?.length)
        ) {
          // Parent is fully selected or all children are selected
          selectedValues.push({ id: parent.id });
        } else if (Array.isArray(childrenIds) && childrenIds.length > 0) {
          // Some children are selected
          selectedValues.push({
            id: parent.id,
            children: childrenIds,
          });
        }
      } else {
        // Handle case where parentId is actually a top-level item without children
        selectedValues.push({ id: parseInt(parentId) });
      }
    });
    return selectedValues;
  }
}

// Usage
document.addEventListener("DOMContentLoaded", () => {
  const hierarchySelects = document.querySelectorAll("select.hierarchy-select");

  hierarchySelects.forEach((selectElement) => {
    new MultipleSelectHierarchy(selectElement, {
      maxSelections: 2,
      placeholder: "Please select",
      searchPlaceholder: "Search",
      maxSelectionsMessage: "You can select a maximum of {n} items.",
    });
  });
});

