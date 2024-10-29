// Add this utility function at the top of the file, before the class definition
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function removeDiacritics(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

class MultipleSelectHierarchy {
  constructor(selectElement, options = {}) {
    // Cache DOM elements as class properties during initialization
    this.selectElement = selectElement;
    this.id = `msh-${Math.random().toString(36).slice(2, 9)}`;
    
    // Cache commonly used DOM elements
    this.domCache = new Map();
    
    // Cache options object
    this.options = {
      maxSelections: 3,
      placeholder: "Please select",
      searchPlaceholder: "Search",
      allText: "All",
      clearAllText: "Clear all",
      selectedText: "You have selected {n} items",
      defaultSelectionText: "Please select location",
      unitChildText: "District",
      ...options,
    };

    this.items = [];
    this.selectedItems = {};
    
    // Use WeakMap for better memory management
    if (!MultipleSelectHierarchy.instances) {
      MultipleSelectHierarchy.instances = new WeakMap();
    }
    MultipleSelectHierarchy.instances.set(selectElement, this);

    // Bind the debounced search handler in the constructor
    this.handleSearch = debounce((searchTerm) => {
      const searchLower = removeDiacritics(searchTerm.toLowerCase());
      if (this.selectedParent) {
        this.renderFilteredChildren(searchLower);
      } else {
        this.renderFilteredItems(searchLower);
      }
    }, 150);

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
                    </div>
                    <input type="hidden" id="${this.id}-selected-items" name="${this.selectElement.name}">
                </div>
                <div class="card select-card" style="display: none;">
                    <div class="card-body">
                        <h5 class="card-title mb-3">${this.options.placeholder}</h5>
                        <div class="search-container">
                          <div class="search-input-wrapper">
                            <svg class="icon-search" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              <path d="M14 14L11 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <input type="text" class="search-input" placeholder="${this.options.searchPlaceholder}" id="${this.id}-search-input">
                          </div>
                        </div>
                        <div id="${this.id}-selection-info" class="mb-2 text-muted">${this.options.defaultSelectionText}</div>
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

    // After setting all the element references, cache them
    this.cacheElements();
  }

  attachEventListeners() {
    // Use event delegation for dynamic elements
    this.itemList.addEventListener('click', (e) => {
      const target = e.target;
      
      if (target.matches('.form-check-input')) {
        const itemId = target.id.replace(`${this.id}-item-`, '');
        const item = this.items.find(i => i.id === parseInt(itemId));
        if (item) {
          this.handleItemSelection(item, target.checked);
        }
      }
      
      if (target.matches('.btn-link') || target.closest('.btn-link')) {
        const itemId = target.closest('li').querySelector('.form-check-input').id.replace(`${this.id}-item-`, '');
        const item = this.items.find(i => i.id === parseInt(itemId));
        if (item) {
          this.handleItemClick(item);
        }
      }
    });

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
    const fragment = document.createDocumentFragment();
    const selectedParentCount = Object.keys(this.selectedItems).length;

    items.forEach((item) => {
      const li = this.createItemElement(item, selectedParentCount);
      fragment.appendChild(li);
    });

    this.itemList.innerHTML = '';
    this.itemList.appendChild(fragment);
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
            <input class="form-check-input" type="checkbox" id="${this.id}-child-${child.id}" 
              ${isChecked ? "checked" : ""}>
            <label class="form-check-label" for="${this.id}-child-${child.id}">${child.name}</label>
          </div>
        `;
        li.querySelector("input").addEventListener("change", (e) =>
          this.handleChildSelection(parent, child, e.target.checked)
        );
        this.itemList.appendChild(li);
      });

      const allChildrenCheckbox = this.itemList.querySelector(`#${this.id}-allChildren`);
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
    if (isChecked) {
      this.selectedItems[item.id] = null;
    } else {
      delete this.selectedItems[item.id];
    }
    this.updateInput();
    this.updateSelectionInfo();
    this.renderItems(this.items);
  }

  handleChildSelection(parent, child, isChecked) {
    if (this.selectedItems[parent.id] === null && !isChecked) {
      // Convert null to array of all child IDs except the one being unchecked
      this.selectedItems[parent.id] = parent.children
        .filter(c => c.id !== child.id)
        .map(c => c.id);
      
      // Update the "All" checkbox
      const allChildrenCheckbox = document.getElementById(`${this.id}-allChildren`);
      if (allChildrenCheckbox) {
        allChildrenCheckbox.checked = false;
      }

      this.updateInput();
      this.updateSelectionInfo();
      this.renderChildren(parent);
    }

    // If this is the first child selection for this parent
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
      // Update the "All" checkbox
      const allChildrenCheckbox = document.getElementById(`${this.id}-allChildren`);
      if (allChildrenCheckbox) {
        allChildrenCheckbox.checked = true;
      }
    }

    this.updateInput();
    this.updateSelectionInfo();
    this.renderChildren(parent);
  }

  handleAllChildrenSelection(parent, isChecked) {
    const selectedParentCount = Object.keys(this.selectedItems).length;
    const isNewParentSelection = !this.selectedItems[parent.id];

    if (
      isChecked &&
      isNewParentSelection &&
      selectedParentCount >= this.options.maxSelections
    ) {
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



  showSelectCard() {
    this.selectCard.style.display = "block";
    this.updateHeader(this.options.placeholder);
    this.renderItems(this.items);
  }

  hideSelectCard() {
    this.selectCard.style.display = "none";
  }

  updateInput() {
    requestAnimationFrame(() => {
      const chipsContainer = this.getElement('chipsContainer');
      const selectedItemsInput = this.getElement('selectedItemsInput');
      
      chipsContainer.innerHTML = '';
      const selectedItems = this.getSelectedItemsForDisplay();
      
      if (selectedItems.length === 0) {
        this.renderPlaceholder();
      } else {
        this.renderChips(selectedItems);
      }
      
      selectedItemsInput.value = JSON.stringify(this.selectedItems);
    });
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
      const backButton = document.createElement("button");
      backButton.className = "btn-back";
      backButton.innerHTML = `
        <svg class="icon-arrow-left" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      backButton.style.cursor = "pointer";
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
      // Show default selection text when no items are selected
      selectionInfo.innerHTML = this.options.defaultSelectionText;
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

  reset() {
    this.selectedItems = {};
    this.updateInput();
    this.updateSelectionInfo();
    this.renderItems(this.items);
    this.hideSelectCard();
  }

  // Static method to reset instances based on a selector
  static resetBySelector(selector) {
    const selectElements = document.querySelectorAll(`${selector} select.hierarchy-select`);
    selectElements.forEach(selectElement => {
      const instance = MultipleSelectHierarchy.instances.get(selectElement);
      if (instance) {
        instance.reset();
      }
    });
  }

  // Static property to store instances
  static instances = new Map();

  destroy() {
    // Clear all cached elements
    this.domCache.clear();
    
    // Remove all event listeners
    this.removeEventListeners();
    
    // Clear instance from WeakMap
    MultipleSelectHierarchy.instances.delete(this.selectElement);
    
    // Clear references
    this.items = null;
    this.selectedItems = null;
    this.options = null;
  }

  createItemElement(item, selectedParentCount) {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    
    const isChecked = this.selectedItems[item.id] !== undefined;
    const isDisabled = !isChecked && selectedParentCount >= this.options.maxSelections;
    const hasChildren = item.children && item.children.length > 0;

    // Calculate selection text only if needed
    let selectionText = '';
    if (hasChildren && isChecked) {
      if (this.selectedItems[item.id] === null) {
        selectionText = ` (${this.options.allText})`;
      } else if (Array.isArray(this.selectedItems[item.id])) {
        selectionText = ` (${this.selectedItems[item.id].length} ${this.options.unitChildText})`;
      }
    }

    // Create checkbox and label container
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'form-check';
    checkboxContainer.innerHTML = `
      <input class="form-check-input" type="checkbox" id="${this.id}-item-${item.id}" 
        ${isChecked ? "checked" : ""} ${isDisabled ? "disabled" : ""}>
      <label class="form-check-label" for="${this.id}-item-${item.id}">
        ${item.name}
        <span class="text-black-50">${selectionText}</span>
      </label>
    `;

    li.appendChild(checkboxContainer);

    // Add chevron button for items with children
    if (hasChildren) {
      const button = document.createElement('button');
      button.className = `btn btn-link p-0 ${isDisabled ? "disabled" : ""}`;
      button.innerHTML = `
        <svg class="icon-chevron-right ${isDisabled ? "text-muted" : ""}" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      li.appendChild(button);
    }

    return li;
  }

  // Add these methods to the MultipleSelectHierarchy class

  renderFilteredChildren(searchTerm) {
    if (!this.selectedParent || !this.selectedParent.children) return;

    const fragment = document.createDocumentFragment();
    
    // Add "All" checkbox first
    const allLi = document.createElement('li');
    allLi.className = 'list-group-item';
    allLi.innerHTML = `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="${this.id}-allChildren">
        <label class="form-check-label" for="${this.id}-allChildren">${this.options.allText}</label>
      </div>
    `;
    fragment.appendChild(allLi);

    // Filter and render matching children
    const filteredChildren = this.selectedParent.children.filter(child =>
      removeDiacritics(child.name.toLowerCase()).includes(searchTerm)
    );

    const allChildrenSelected = this.selectedItems[this.selectedParent.id] === null;

    filteredChildren.forEach(child => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      const isChecked = allChildrenSelected ||
        (this.selectedItems[this.selectedParent.id] &&
          this.selectedItems[this.selectedParent.id].includes(child.id));

      li.innerHTML = `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="${this.id}-child-${child.id}" 
            ${isChecked ? "checked" : ""}>
          <label class="form-check-label" for="${this.id}-child-${child.id}">${child.name}</label>
        </div>
      `;

      li.querySelector('input').addEventListener('change', e =>
        this.handleChildSelection(this.selectedParent, child, e.target.checked)
      );
      fragment.appendChild(li);
    });

    this.itemList.innerHTML = '';
    this.itemList.appendChild(fragment);

    // Update "All" checkbox state
    const allChildrenCheckbox = this.itemList.querySelector(`#${this.id}-allChildren`);
    allChildrenCheckbox.checked = allChildrenSelected;
    allChildrenCheckbox.addEventListener('change', e =>
      this.handleAllChildrenSelection(this.selectedParent, e.target.checked)
    );
  }

  renderFilteredItems(searchTerm) {
    const filteredItems = this.items.filter(item =>
      removeDiacritics(item.name.toLowerCase()).includes(searchTerm)
    );
    this.renderItems(filteredItems);
  }

  getSelectedItemsForDisplay() {
    return Object.entries(this.selectedItems)
      .map(([itemId, childrenIds]) => {
        const item = this.items.find(i => i.id === parseInt(itemId));
        if (!item) return null;

        let displayText = item.name;
        if (item.children) {
          if (childrenIds === null) {
            displayText += ` (${this.options.allText})`;
          } else if (Array.isArray(childrenIds)) {
            displayText += ` (${childrenIds.length} ${this.options.unitChildText})`;
          }
        }
        return this.createChip(displayText, itemId);
      })
      .filter(chip => chip !== null);
  }

  renderPlaceholder() {
    const placeholderSpan = document.createElement('span');
    placeholderSpan.textContent = this.options.placeholder;
    placeholderSpan.className = 'placeholder-text';
    this.chipsContainer.appendChild(placeholderSpan);
  }

  updateHeader(title, showBackButton = false) {
    const cardBody = this.selectCard.querySelector('.card-body');
    const existingHeader = cardBody.querySelector('h5.card-title');

    if (existingHeader) {
      existingHeader.remove();
    }

    const header = document.createElement('h5');
    header.className = 'card-title mt-0 d-flex align-items-center';

    if (showBackButton) {
      const backButton = document.createElement('button');
      backButton.className = 'btn-back';
      backButton.innerHTML = `
        <svg class="icon-arrow-left" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      backButton.addEventListener('click', () => this.handleBackClick());
      header.appendChild(backButton);
    }

    header.appendChild(document.createTextNode(title));
    cardBody.insertBefore(header, cardBody.firstChild);
  }

  removeEventListeners() {
    // Remove all event listeners that were added
    this.itemList.removeEventListener('click', this.handleItemClick);
    this.chipsContainer.removeEventListener('click', this.showSelectCard);
    this.chipsContainer.removeEventListener('focus', this.handleFocus);
    this.chipsContainer.removeEventListener('blur', this.handleBlur);
    this.searchInput.removeEventListener('input', this.handleSearch);
    
    // Remove document click listener
    document.removeEventListener('click', this.handleOutsideClick);
  }

  // Add this method to cache DOM elements
  cacheElements() {
    // Cache frequently accessed elements
    this.domCache.set('container', this.container);
    this.domCache.set('chipsContainer', this.chipsContainer);
    this.domCache.set('input', this.input);
    this.domCache.set('selectedItemsInput', this.selectedItemsInput);
    this.domCache.set('selectCard', this.selectCard);
    this.domCache.set('searchInput', this.searchInput);
    this.domCache.set('selectionInfo', this.selectionInfo);
    this.domCache.set('itemList', this.itemList);
  }

  // Add a method to get cached elements
  getElement(key) {
    if (this.domCache.has(key)) {
      return this.domCache.get(key);
    }
    // If element isn't cached, query it and cache it
    const element = this.container.querySelector(`#${this.id}-${key}`);
    if (element) {
      this.domCache.set(key, element);
    }
    return element;
  }
}

// Usage example:
document.addEventListener("DOMContentLoaded", () => {
  const hierarchySelects = document.querySelectorAll("select.hierarchy-select");
  hierarchySelects.forEach((selectElement) => {
    new MultipleSelectHierarchy(selectElement, {
      maxSelections: 3,
      placeholder: "Please select",
      searchPlaceholder: "Search",
      defaultSelectionText: "Chọn tỉnh thành",
      unitChildText: "Quận/Huyện",
      allText: "Tất cả"
    });
  });

  // Example of how to use the resetBySelector method
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('reset', (event) => {
      event.preventDefault();
      MultipleSelectHierarchy.resetBySelector(`#${form.id}`);
      form.reset();
    });
  });
});

// Expose the MultipleSelectHierarchy class globally
window.MultipleSelectHierarchy = MultipleSelectHierarchy;

