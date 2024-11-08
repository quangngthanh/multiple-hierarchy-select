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
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

class MultipleSelectHierarchy {
    constructor(element, data, options = {}) {
        this.element = element;
        this.data = data;
        this.id = `msh-${Math.random().toString(36).slice(2, 9)}`;
        this.domCache = new Map();
        this.options = {
            maxSelections: 3,
            placeholder: "Please select",
            searchPlaceholder: "Search",
            allText: "All",
            clearAllText: "Clear",
            selectedText: "You have selected {n} items",
            defaultSelectionText: "Please select items",
            showSearchBox: true,
            showCardTitle: true,
            unitChildText: "Items",
            showGroupHeaders: true,
            onChange: options.onChange || function() {},
            ...options,
        };
        console.log('this.options :>> ', this.options);
        this.items = this.processData(data);
        this.selectedItems = {};
        if (options.value) {
            this.initializeWithValue(options.value);
        }
        if (!MultipleSelectHierarchy.instances) {
            MultipleSelectHierarchy.instances = new WeakMap();
        }
        MultipleSelectHierarchy.instances.set(element, this);

        this.handleSearch = debounce((searchTerm) => {
            const searchLower = removeDiacritics(searchTerm.toLowerCase());
            if (this.selectedParent) {
                this.renderFilteredChildren(searchLower);
            } else {
                this.renderFilteredItems(searchLower);
            }
        }, 150);
        this.init();
        this.abortController = new AbortController();
        this.signal = this.abortController.signal;
        this.scrollPositions = new Map();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.updateInput();
        this.renderItems(this.items);
    }

    triggerOnChange() {
        if (typeof this.options.onChange === "function") {
            setTimeout(() => {
                const valueInput = this.getElement("selectedItemsInput");
                this.options.onChange(valueInput.value);
            }, 0);
        }
    }
    
    render() {
        console.log('this.options :>> ', this.options.showCardTitle);
        const container = document.createElement("div");
        container.className = "multiple-select-hierarchy";
        container.innerHTML = `
            <div class="dropdown">
                <div class="input-group">
                    <div class="form-control d-flex flex-wrap align-items-center" id="${this.id}-chips-container" tabindex="0">
                    </div>
                    <input type="hidden" id="${this.id}-selected-items" name="${this.element.name || "selected-items"}">
                </div>
                <div class="card select-card" style="display: none;">
                    <div class="p-3" id="${this.id}-card-body">
                        ${this.options.showCardTitle !== false ? `
                            <h5 class="card-title mb-3">${this.options.placeholder}</h5>
                        ` : ''}
                        ${this.options.showSearchBox !== false ? `
                            <div class="search-container">
                                <div class="search-input-wrapper">
                                    <svg class="icon-search" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M14 14L11 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <input type="text" class="search-input" placeholder="${this.options.searchPlaceholder}" id="${this.id}-search-input">
                                </div>
                            </div>
                        ` : ''}
                        <div id="${this.id}-selection-info" class="mb-2 text-muted">${this.options.defaultSelectionText}</div>
                        <ul class="list-group" id="${this.id}-item-list"></ul>
                    </div>
                </div>
            </div>
        `;

        this.element.appendChild(container);

        this.container = container;
        this.chipsContainer = container.querySelector(
            `#${this.id}-chips-container`
        );
        this.selectedItemsInput = container.querySelector(
            `#${this.id}-selected-items`
        );
        this.selectCard = container.querySelector(".select-card");
        this.searchInput = container.querySelector(`#${this.id}-search-input`);
        this.selectionInfo = container.querySelector(`#${this.id}-selection-info`);
        this.itemList = container.querySelector(`#${this.id}-item-list`);

        this.cacheElements();
    }

    attachEventListeners() {
        this.itemList.addEventListener(
            "click",
            (e) => {
                const target = e.target;
                const btnLink = target.closest(".btn-link");
                const listItem = target.closest(".list-group-item");

                // Handle checkbox clicks
                if (target.matches(".form-check-input")) {
                    // Check if this is a child checkbox
                    if (target.id.startsWith(`${this.id}-child-`)) {
                        const itemId = target.id.replace(`${this.id}-child-`, "");
                        const item = this.findItemById((itemId));
                        if (item && this.selectedParent) {
                            this.handleChildSelection(
                                this.selectedParent,
                                item,
                                target.checked
                            );
                        }
                    } else if (target.id === `${this.id}-allChildren`) {
                        // Handle "All" checkbox
                        if (this.selectedParent) {
                            this.handleAllChildrenSelection(
                                this.selectedParent,
                                target.checked
                            );
                        }
                    } else {
                        // Handle parent checkbox
                        const itemId = target.id.replace(`${this.id}-item-`, "");
                        const item = this.findItemById((itemId));
                        if (item) {
                            this.handleItemSelection(item, target.checked);
                        }
                    }
                    return;
                }

                // Handle button link clicks
                if (btnLink) {
                    e.preventDefault();
                    e.stopPropagation();
                    const listItem = btnLink.closest("li");
                    const itemId = listItem
                        .querySelector(".form-check-input")
                        .id.replace(`${this.id}-item-`, "");
                    const item = this.findItemById((itemId));
                    if (item) {
                        this.handleItemClick(item);
                    }
                    return;
                }
                // Handle list item clicks (excluding clicks on buttons and checkboxes)
                if (
                    listItem &&
                    !target.closest(".btn-link") &&
                    !target.matches(".form-check-input")
                ) {
                    const checkbox = listItem.querySelector(".form-check-input");
                    if (!checkbox) return;

                    checkbox.checked = !checkbox.checked;

                    // Check if this is a child item
                    if (checkbox.id.startsWith(`${this.id}-child-`)) {
                        const itemId = checkbox.id.replace(`${this.id}-child-`, "");
                        const item = this.findItemById((itemId));
                        if (item && this.selectedParent) {
                            this.handleChildSelection(
                                this.selectedParent,
                                item,
                                checkbox.checked
                            );
                        }
                    } else if (checkbox.id === `${this.id}-allChildren`) {
                        // Handle "All" checkbox
                        if (this.selectedParent) {
                            this.handleAllChildrenSelection(
                                this.selectedParent,
                                checkbox.checked
                            );
                        }
                    } else {
                        // Handle parent checkbox
                        const itemId = checkbox.id.replace(`${this.id}-item-`, "");
                        const item = this.findItemById((itemId));
                        if (item) {
                            this.handleItemSelection(item, checkbox.checked);
                        }
                    }
                }
            }, { signal: this.signal }
        );

        this.chipsContainer.addEventListener(
            "click",
            () => {
                this.chipsContainer.focus();
                this.showSelectCard();
            }, { signal: this.signal }
        );

        this.chipsContainer.addEventListener(
            "focus",
            () => {
                this.chipsContainer.classList.add("focused");
            }, { signal: this.signal }
        );

        this.chipsContainer.addEventListener(
            "blur",
            () => {
                this.chipsContainer.classList.remove("focused");
            }, { signal: this.signal }
        );

        document.addEventListener(
            "click",
            (e) => {
                if (!this.selectCard.contains(e.target) &&
                    !this.chipsContainer.contains(e.target)
                ) {
                    this.hideSelectCard();
                }
            }, { signal: this.signal }
        );

        this.selectCard.addEventListener("click", (e) => e.stopPropagation(), {
            signal: this.signal,
        });

        // Only attach search input listener if search box is shown
        if (this.options.showSearchBox !== false && this.searchInput) {
            this.searchInput.addEventListener("input", 
                (e) => this.handleSearch(e.target.value), 
                { signal: this.signal }
            );
        }
    }

    setItems(items) {
        this.items = items;
        this.renderItems(this.items);
    }

    renderItems(items) {
        const fragment = document.createDocumentFragment();
        const selectedParentCount = Object.keys(this.selectedItems).length;

        items.forEach((group) => {
            if (this.options.showGroupHeaders) {
                const groupHeader = document.createElement("li");
                groupHeader.className = "list-group-item group-header";
                groupHeader.innerHTML = `<div class="group-label text-black">${group.name}</div>`;
                fragment.appendChild(groupHeader);
            }

            if (group.children && group.children.length > 0) {
                group.children.forEach((subgroup) => {
                    const li = this.createItemElement(subgroup, selectedParentCount);
                    fragment.appendChild(li);
                });
            }
        });

        this.itemList.innerHTML = "";
        this.itemList.appendChild(fragment);
        this.updateSelectionInfo();
    }

    renderChildren(parent) {
            this.itemList.innerHTML = "";

            if (parent.children && parent.children.length > 0) {
                const allChildrenSelected = this.selectedItems[parent.id] === null;
                const selectedChildIds = this.selectedItems[parent.id] || [];

                this.itemList.innerHTML = `<li class="list-group-item">
                    <div class="form-check d-flex align-item-center gap-2">
                        <input class="form-check-input" type="checkbox" id="${this.id}-allChildren"${allChildrenSelected ? "checked" : ""}>
                        <label class="form-check-label mt-1" for="${this.id}-allChildren">${this.options.allText}</label>
                    </div>
                  </li>`;

                parent.children.forEach((child) => {
                            const li = document.createElement("li");
                            li.className = "list-group-item";

                            const hasChildren = child.children && child.children.length > 0;
                            const isChecked =
                                allChildrenSelected || selectedChildIds.some((id) => id == child.id);

                            li.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="form-check d-flex align-item-center gap-2">
                        <input class="form-check-input" type="checkbox" id="${this.id}-child-${child.id}" ${isChecked ? "checked" : ""}>
                        <label class="form-check-label mt-1" for="${this.id}-child-${child.id}">${child.name}${this.selectedItems[child.id]
            ? `<span class="text-black-50">
                                  ${this.selectedItems[child.id] === null
              ? `\u00A0(${this.options.allText})`
              : `\u00A0(${this.selectedItems[child.id].length
              }\u00A0${this.options.unitChildText})`
            }
                              </span>`
            : ""
          }
                        </label>
                    </div>
                    ${hasChildren
            ? `
                        <button type="button" class="btn btn-link p-0">
                            <svg class="icon-chevron-right" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    `
            : ""
          }
                </div>
            `;

        const checkbox = li.querySelector(`#${this.id}-child-${child.id}`);
        checkbox.addEventListener(
          "change",
          (e) => this.handleChildSelection(parent, child, e.target.checked),
          { signal: this.signal }
        );

        if (hasChildren) {
          const button = li.querySelector(".btn-link");
          button.addEventListener(
            "click",
            (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.handleItemClick(child);
            },
            { signal: this.signal }
          );
        }

        this.itemList.appendChild(li);
      });

      const allChildrenCheckbox = this.itemList.querySelector(
        `#${this.id}-allChildren`
      );
      allChildrenCheckbox.addEventListener(
        "change",
        (e) => this.handleAllChildrenSelection(parent, e.target.checked),
        { signal: this.signal }
      );
    }
  }

  handleItemSelection(item, isChecked) {
    const selectedParentCount = Object.keys(this.selectedItems).length;
    const isNewSelection = !this.selectedItems[item.id];

    if (
      isChecked &&
      isNewSelection &&
      selectedParentCount >= this.options.maxSelections
    ) {
      setTimeout(() => {
        const checkbox = document.getElementById(`${this.id}-item-${item.id}`);
        if (checkbox) checkbox.checked = false;
      }, 0);
      return;
    }
    
    if (isChecked) {
      this.selectedItems[item.id] = null;
    } else {
      delete this.selectedItems[item.id];
    }

    this.updateInput();
    this.updateSelectionInfo();
    this.renderItems(this.items);
    this.triggerOnChange();
  }

  handleChildSelection(parent, child, isChecked) {
    if (this.selectedItems[parent.id] === null && !isChecked) {
      this.selectedItems[parent.id] = parent.children
        .filter((c) => c.id != child.id)
        .map((c) => c.id);

      const allChildrenCheckbox = document.getElementById(
        `${this.id}-allChildren`
      );
      if (allChildrenCheckbox) {
        allChildrenCheckbox.checked = false;
      }
    } else {
      if (!this.selectedItems[parent.id]) {
        this.selectedItems[parent.id] = [];
      }

      if (isChecked) {
        if (!this.selectedItems[parent.id].some((id) => id == child.id)) {
          this.selectedItems[parent.id].push(child.id);
        }
      } else {
        this.selectedItems[parent.id] = this.selectedItems[parent.id].filter(
          (id) => id != child.id
        );
      }

      if (this.selectedItems[parent.id].length === parent.children.length) {
        this.selectedItems[parent.id] = null;
        const allChildrenCheckbox = document.getElementById(
          `${this.id}-allChildren`
        );
        if (allChildrenCheckbox) {
          allChildrenCheckbox.checked = true;
        }
      }
    }

    if (
      Array.isArray(this.selectedItems[parent.id]) &&
      this.selectedItems[parent.id].length === 0
    ) {
      delete this.selectedItems[parent.id];
    }

    this.updateInput();
    this.updateSelectionInfo();
    this.renderChildren(parent);
    this.triggerOnChange();
  }

  handleAllChildrenSelection(parent, isChecked) {
    const selectedParentCount = Object.keys(this.selectedItems).length;
    const isNewParentSelection = !this.selectedItems[parent.id];

    if (
      isChecked &&
      isNewParentSelection &&
      selectedParentCount >= this.options.maxSelections
    ) {
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
    this.triggerOnChange();
  }

  handleItemClick(item) {
    if (!item) return;

    const itemList = this.getElement("itemList");
    this.scrollPositions.set("main", itemList.scrollTop);

    // Disable smooth scrolling temporarily
    itemList.style.scrollBehavior = "auto";

    this.selectedParent = item;
    this.searchInput.value = "";
    this.renderChildren(item);
    this.updateSelectionInfo();
    this.updateHeader(item.name, true);

    itemList.scrollTop = 0;

    setTimeout(() => {
      itemList.style.scrollBehavior = "smooth";
    }, 100);
  }

  handleBackClick() {
    if (this.selectedParent) {
      const itemList = this.getElement("itemList");
      const previousScrollPosition = this.scrollPositions.get("main");

      // Disable smooth scrolling temporarily
      itemList.style.scrollBehavior = "auto";

      // Reset to main view
      this.selectedParent = null;
      this.updateHeader(this.options.placeholder, false);
      this.renderItems(this.items);

      // Restore scroll position immediately without animation
      if (previousScrollPosition !== undefined) {
        itemList.scrollTop = previousScrollPosition;
      }

      // Re-enable smooth scrolling after a small delay
      setTimeout(() => {
        itemList.style.scrollBehavior = "smooth";
      }, 100);
    }
    this.searchInput.value = "";
  }

  showSelectCard() {
    this.selectCard.style.display = "block";
    this.updateHeader(this.options.placeholder);
    this.renderItems(this.items);
  }

  hideSelectCard() {
    if (this.selectCard) {
      this.selectCard.style.display = "none";
      this.scrollPositions.clear();
    }
  }

  updateInput() {
    requestAnimationFrame(() => {
        const chipsContainer = this.getElement("chipsContainer");
        const selectedItemsInput = this.getElement("selectedItemsInput");

        chipsContainer.innerHTML = "";
        const selectedItems = this.getSelectedItemsForDisplay();

        if (selectedItems.length === 0) {
            this.renderPlaceholder();
        } else {
            this.renderChips(selectedItems);
        }

        // Choose output format based on showGroupHeaders option
        const inputValue = this.options.showGroupHeaders 
            ? this.getSelectedItemsWithGroups()
            : this.getSelectedItemsWithoutGroups();
              
          selectedItemsInput.value = JSON.stringify(inputValue);
      });
  }


  renderChips(chips) {
    const containerWidth = this.chipsContainer.offsetWidth;
    const chipMargin = 4;
    const chipPadding = 8;
    const containerPadding = 10;
    const closeButtonWidth = 16;
    const availableWidth = containerWidth - containerPadding;
    
    let totalChipsWidth = 0;
    const chipWidths = [];

    chips.forEach((chip) => {
      this.chipsContainer.appendChild(chip);
      const chipWidth = chip.offsetWidth + chipMargin;
      totalChipsWidth += chipWidth;
      chipWidths.push(chipWidth);
      this.chipsContainer.removeChild(chip);
    });

    if (totalChipsWidth > availableWidth) {
      const scaleFactor = 0.97*availableWidth / totalChipsWidth;
      let currentLineWidth = 0;
      
      chips.forEach((chip, index) => {
        const newWidth =
          Math.floor(chipWidths[index] * scaleFactor) - chipMargin;
        this.adjustChipWidth(chip, newWidth, closeButtonWidth, chipPadding);
        currentLineWidth += newWidth + chipMargin;
        this.chipsContainer.appendChild(chip);
      });
    } else {
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
    chip.querySelector(".close").addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        this.removeSelection(id);
      },
      { signal: this.signal }
    );
    return chip;
  }

  removeSelection(id) {
    delete this.selectedItems[id];
    this.updateInput();
    this.updateSelectionInfo();
    this.renderItems(this.items);
    this.triggerOnChange();
  }

  updateHeader(title, showBackButton = false) {
    const cardBody = this.selectCard.querySelector(`#${this.id}-card-body`);
    const existingHeader = cardBody.querySelector("h5.card-title");

    if (existingHeader) {
      existingHeader.remove();
    }

    if (this.options.showCardTitle === false) {
      return;
    }

    const header = document.createElement("h5");
    header.className = "card-title mt-0 d-flex align-items-center";

    if (showBackButton) {
      const backButton = document.createElement("button");
      backButton.type = "button";
      backButton.className = "btn-back";
      backButton.innerHTML = `
            <svg class="icon-arrow-left" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
      backButton.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleBackClick();
        },
        { signal: this.signal }
      );
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
                <a href="#" class="text-primary text-decoration-none" id="${this.id
        }-clear-all">
                    ${this.options.clearAllText}
                </a>
            </div>
        `;

      const clearAllButton = selectionInfo.querySelector(
        `#${this.id}-clear-all`
      );
      clearAllButton.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          this.clearAll();
        },
        { signal: this.signal }
      );
    } else {
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
    this.triggerOnChange();
  }

  static resetBySelector(formElement, selector) {
    // Only search within the specific form
    const containers = formElement.querySelectorAll(selector);
    containers.forEach((container) => {
      const instance = MultipleSelectHierarchy.instances.get(container);
      if (instance) {
        instance.reset();
      }
    });
  }

  static instances = new Map();

  // Only use when remove component
  destroy() {
    this.abortController.abort();
    this.domCache.clear();
    MultipleSelectHierarchy.instances.delete(this.selectElement);
    this.items = null;
    this.selectedItems = null;
    this.options = null;
    this.abortController = null;
  }

  createItemElement(item, selectedParentCount) {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center subgroup-item";
    li.dataset.itemId = String(item.id);

    const isChecked = this.selectedItems[item.id] !== undefined;
    const isDisabled = !isChecked && selectedParentCount >= this.options.maxSelections;
    const hasChildren = item.children && item.children.length > 0;

    // Add pointer-events-none class if disabled
    if (isDisabled) {
      li.classList.add('pointer-events-none');
    }

    let selectionText = "";
    if (hasChildren && isChecked) {
      if (this.selectedItems[item.id] === null) {
        selectionText = `\u00A0(${this.options.allText})`;
      } else if (Array.isArray(this.selectedItems[item.id])) {
        selectionText = `\u00A0(${this.selectedItems[item.id].length}\u00A0${this.options.unitChildText
          })`;
      }
    }

    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "form-check d-flex align-item-center gap-2";
    checkboxContainer.innerHTML = `
        <input class="form-check-input" type="checkbox" id="${this.id}-item-${item.id}" 
            ${isChecked ? "checked" : ""} ${isDisabled ? "disabled" : ""}>
        <label class="form-check-label mt-1" for="${this.id}-item-${item.id}">
            ${item.name}
            <span class="text-black-50">${selectionText}</span>
        </label>
    `;

    li.appendChild(checkboxContainer);

    if (hasChildren) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-link p-0 arr-icon-dropdown";
      button.innerHTML = `
            <svg class="icon-chevron-right" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
      li.appendChild(button);
    }

    return li;
  }


  renderFilteredChildren(searchTerm) {
    if (!this.selectedParent || !this.selectedParent.children) return;

    const fragment = document.createDocumentFragment();

    // Always show "All" option
    const allLi = document.createElement("li");
    allLi.className = "list-group-item";
    allLi.innerHTML = `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" id="${this.id}-allChildren">
            <label class="form-check-label mt-1" for="${this.id}-allChildren">${this.options.allText}</label>
        </div>
    `;
    fragment.appendChild(allLi);

    // Filter children
    const filteredChildren = this.selectedParent.children.filter((child) =>
      removeDiacritics(child.name.toLowerCase()).includes(searchTerm)
    );

    const allChildrenSelected =
      this.selectedItems[this.selectedParent.id] === null;

    filteredChildren.forEach((child) => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      const isChecked =
        allChildrenSelected ||
        (this.selectedItems[this.selectedParent.id] &&
          this.selectedItems[this.selectedParent.id].includes(child.id));

      li.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="form-check d-flex align-item-center gap-2">
                    <input class="form-check-input" type="checkbox" id="${this.id
        }-child-${child.id}" 
                        ${isChecked ? "checked" : ""}>
                    <label class="form-check-label mt-1 " for="${this.id
        }-child-${child.id}">
                        ${child.name}
                    </label>
                </div>
                ${child.children && child.children.length > 0
          ? `
                    <button type="button" class="btn btn-link p-0">
                        <svg class="icon-chevron-right" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                `
          : ""
        }
            </div>
        `;

      // Add event listeners
      const checkbox = li.querySelector(`#${this.id}-child-${child.id}`);
      checkbox.addEventListener(
        "change",
        (e) =>
          this.handleChildSelection(
            this.selectedParent,
            child,
            e.target.checked
          ),
        { signal: this.signal }
      );

      if (child.children && child.children.length > 0) {
        const button = li.querySelector(".btn-link");
        button.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            this.handleItemClick(child);
          },
          { signal: this.signal }
        );
      }

      fragment.appendChild(li);
    });

    this.itemList.innerHTML = "";
    this.itemList.appendChild(fragment);

    // Update "All" checkbox state
    const allChildrenCheckbox = this.itemList.querySelector(
      `#${this.id}-allChildren`
    );
    allChildrenCheckbox.checked = allChildrenSelected;
    allChildrenCheckbox.addEventListener(
      "change",
      (e) =>
        this.handleAllChildrenSelection(this.selectedParent, e.target.checked),
      { signal: this.signal }
    );
  }

  renderFilteredItems(searchTerm) {
    if (this.selectedParent) {
      // If we're in a subgroup view, search through its children
      this.renderFilteredChildren(searchTerm);
    } else {
      // If we're in the main view, search through groups and subgroups
      const filteredItems = this.items
        .map((group) => {
          // First check if group name matches
          const groupMatches = removeDiacritics(
            group.name.toLowerCase()
          ).includes(searchTerm);

          // Filter children (subgroups)
          const filteredChildren = group.children.filter((subgroup) =>
            removeDiacritics(subgroup.name.toLowerCase()).includes(searchTerm)
          );

          // Return group if either group matches or has matching children
          if (groupMatches || filteredChildren.length > 0) {
            return {
              ...group,
              children: filteredChildren,
            };
          }
          return null;
        })
        .filter(Boolean); // Remove null items

      this.renderItems(filteredItems);
    }
  }

  getSelectedItemsForDisplay() {
    const selectedItems = [];

    // Iterate through all items to find selected subgroups
    this.items.forEach((group) => {
      group.children.forEach((subgroup) => {
        if (this.selectedItems[subgroup.id] !== undefined) {
          let displayText = subgroup.name;
          if (this.selectedItems[subgroup.id] === null) {
            displayText += ``;
          } else if (Array.isArray(this.selectedItems[subgroup.id])) {
            displayText += `\u00A0(${this.selectedItems[subgroup.id].length
              }\u00A0${this.options.unitChildText})`;
          }

          selectedItems.push(this.createChip(displayText, subgroup.id));
        }
      });
    });

    return selectedItems;
  }

  renderPlaceholder() {
    const placeholderSpan = document.createElement("span");
    placeholderSpan.textContent = this.options.placeholder;
    placeholderSpan.className = "placeholder-text";
    this.chipsContainer.appendChild(placeholderSpan);
  }

  cacheElements() {
    this.domCache.set("container", this.container);
    this.domCache.set("chipsContainer", this.chipsContainer);
    this.domCache.set("input", this.input);
    this.domCache.set("selectedItemsInput", this.selectedItemsInput);
    this.domCache.set("selectCard", this.selectCard);
    this.domCache.set("searchInput", this.searchInput);
    this.domCache.set("selectionInfo", this.selectionInfo);
    this.domCache.set("itemList", this.itemList);
  }

  getElement(key) {
    if (this.domCache.has(key)) {
      return this.domCache.get(key);
    }
    const element = this.container.querySelector(`#${this.id}-${key}`);
    if (element) {
      this.domCache.set(key, element);
    }
    return element;
  }

  processData(items, parentId = '') {
    return items.map((item) => {
      // Create unique ID by combining parent ID with current ID
      const uniqueId = parentId ? `${parentId}_${item.id}` : `${item.id}`;

      return {
        id: uniqueId,  // Use combined ID internally
        name: item.name,
        children: item.children ? this.processData(item.children, uniqueId) : [],
      };
    });
  }



  // Add this helper method to find items by ID
  findItemById(id, items = this.items) {
    // Check children level first
    for (const item of items) {
      if (item.children) {
        const foundInChildren = item.children.find((child) => child.id == id);
        if (foundInChildren) {
          return foundInChildren;
        }
      }
    }

    // Then check current level
    const foundAtCurrentLevel = items.find((item) => item.id == id);
    if (foundAtCurrentLevel) {
      return foundAtCurrentLevel;
    }

    // Finally check deeper levels
    for (const item of items) {
      if (item.children) {
        const found = this.findItemById(id, item.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  getSelectedItemsWithGroups() {
    const selectedWithGroups = {};

    this.items.forEach((group) => {
      const selectedChildrenInGroup = group.children.filter(
        (subgroup) => this.selectedItems[subgroup.id] !== undefined
      );

      if (selectedChildrenInGroup.length > 0) {
        // Extract original group ID
        const groupId = this.getOriginalId(group.id);
        selectedWithGroups[groupId] = {};

        selectedChildrenInGroup.forEach((subgroup) => {
          // Extract original subgroup ID
          const subgroupId = this.getOriginalId(subgroup.id);

          if (this.selectedItems[subgroup.id] === null) {
            selectedWithGroups[groupId][subgroupId] = null;
          } else if (Array.isArray(this.selectedItems[subgroup.id])) {
            // Extract original IDs for children
            selectedWithGroups[groupId][subgroupId] =
              this.selectedItems[subgroup.id].map(id => this.getOriginalId(id));
          }
        });
      }
    });

    return selectedWithGroups;
  }

  getSelectedItemsWithoutGroups() {
    const selectedIds = [];

    this.items.forEach(group => {
        group.children.forEach(subgroup => {
            if (this.selectedItems[subgroup.id] !== undefined) {
                const subgroupId = this.getOriginalId(subgroup.id);
                
                if (this.selectedItems[subgroup.id] === null) {
                    // If all children are selected, just add the subgroup ID
                    selectedIds.push(subgroupId);
                } else if (Array.isArray(this.selectedItems[subgroup.id])) {
                    // Add individual child IDs
                    this.selectedItems[subgroup.id].forEach(childId => {
                        selectedIds.push(this.getOriginalId(childId));
                    });
                }
            }
        });
    });

    return selectedIds;
  }

  getOriginalId(combinedId) {
    return combinedId.split('_').pop();
  }

  initializeWithValue(value) {
    try {
        let processedValue = typeof value === "string" ? JSON.parse(value) : value;
        
        // Count total selections in the initial value
        let totalSelections = 0;
        Object.entries(processedValue).forEach(([groupId, groupData]) => {
            totalSelections += Object.keys(groupData).length;
        });

        // If total selections exceed max, only take the first max items
        if (totalSelections > this.options.maxSelections) {
            console.warn(`Initial selections (${totalSelections}) for ${this.element.name} exceed maximum allowed (${this.options.maxSelections}). Only first ${this.options.maxSelections} items will be selected.`);
            
            let currentCount = 0;
            const trimmedValue = {};

            // Take only up to maxSelections items
            outer: for (const [groupId, groupData] of Object.entries(processedValue)) {
                trimmedValue[groupId] = {};
                for (const [subgroupId, selections] of Object.entries(groupData)) {
                    if (currentCount >= this.options.maxSelections) break outer;
                    trimmedValue[groupId][subgroupId] = selections;
                    currentCount++;
                }
            }

            processedValue = trimmedValue;
        }

        // Process the (potentially trimmed) initial value
        Object.entries(processedValue).forEach(([groupId, groupData]) => {
            Object.entries(groupData).forEach(([subgroupId, selections]) => {
                const parent = this.findItemById(`${groupId}_${subgroupId}`);
                if (!parent) return;

                if (selections === null) {
                    this.selectedItems[parent.id] = null;
                } else if (Array.isArray(selections)) {
                    this.selectedItems[parent.id] = selections.map(childId => {
                        const child = parent.children?.find(c =>
                            this.getOriginalId(c.id) == childId
                        );
                        return child ? child.id : `${parent.id}_${childId}`;
                    });
                }
            });
        });
    } catch (error) {
        console.error("Error initializing with value:", error);
    }
}

  setValue(value) {
    this.selectedItems = {};
    this.initializeWithValue(value);
    this.updateInput();
    this.updateSelectionInfo();
    this.renderItems(this.items);
    this.triggerOnChange();
  }

  static parseSelectOptions(element) {
    const options = Array.from(element.options).filter(opt => opt.value || opt.hasAttribute('data-group-tag-open'));
    const hierarchyData = [];
    const selectedValues = {};
    
    let currentGroup = null;
    let currentSubgroup = null;

    options.forEach(option => {
        if (option.hasAttribute('data-group-tag-open')) {
            // Start a new group
            currentGroup = {
                id: option.value || `group_${hierarchyData.length}`,
                name: option.label || option.text,
                children: []
            };
            hierarchyData.push(currentGroup);
            currentSubgroup = null;
            
        } else if (option.hasAttribute('data-group-tag-close')) {
            // End current group
            currentGroup = null;
            currentSubgroup = null;
            
        } else if (option.hasAttribute('data-subgroup-tag-open')) {
            // Start a new subgroup
            currentSubgroup = {
                id: option.value,
                name: option.label || option.text,
                children: []
            };
            if (currentGroup) {
                currentGroup.children.push(currentSubgroup);
            }
            
            // Handle selected subgroups
            if (option.selected && currentGroup) {
                if (!selectedValues[currentGroup.id]) {
                    selectedValues[currentGroup.id] = {};
                }
                selectedValues[currentGroup.id][option.value] = null;
            }
            
        } else if (option.hasAttribute('data-subgroup-tag-close')) {
            // End current subgroup
            currentSubgroup = null;
            
        } else if (currentGroup && !currentSubgroup) {
            // Handle direct children of group (subgroups without data-subgroup attribute)
            const subgroup = {
                id: option.value,
                name: option.text,
                children: [] // Empty children array for subgroups without children
            };
            currentGroup.children.push(subgroup);
            
            // Handle selected subgroups
            if (option.selected) {
                if (!selectedValues[currentGroup.id]) {
                    selectedValues[currentGroup.id] = {};
                }
                selectedValues[currentGroup.id][option.value] = null;
            }
            
        } else if (currentSubgroup) {
            // Add child to current subgroup
            currentSubgroup.children.push({
                id: option.value,
                name: option.text
            });
            
            // Handle selected children
            if (option.selected && currentGroup) {
                if (!selectedValues[currentGroup.id]) {
                    selectedValues[currentGroup.id] = {};
                }
                if (!selectedValues[currentGroup.id][currentSubgroup.id]) {
                    selectedValues[currentGroup.id][currentSubgroup.id] = [];
                }
                if (Array.isArray(selectedValues[currentGroup.id][currentSubgroup.id])) {
                    selectedValues[currentGroup.id][currentSubgroup.id].push(option.value);
                }
            }
        }
    });

    return {
        data: hierarchyData,
        selectedValues: selectedValues
    };
}

  static build(selector, config = {}) {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).map(element => {
        // Get configuration from data attributes
        const dataConfig = {
            maxSelections: parseInt(element.dataset.maxSelections) || config.maxSelections,
            placeholder: element.dataset.placeholder || config.placeholder,
            searchPlaceholder: element.dataset.searchPlaceholder || config.searchPlaceholder,
            defaultSelectionText: element.dataset.defaultSelectionText || config.defaultSelectionText,
            unitChildText: element.dataset.unitChildText || config.unitChildText,
            allText: element.dataset.allText || config.allText,
            showSearchBox: element.dataset.showSearchBox !== undefined ? 
                element.dataset.showSearchBox === 'true' : 
                config.showSearchBox,
            showCardTitle: element.dataset.showCardTitle !== undefined ?
                element.dataset.showCardTitle === 'true' :
                config.showCardTitle,
            showGroupHeaders: element.dataset.showGroupHeaders !== undefined ? 
                element.dataset.showGroupHeaders === 'true' : 
                config.showGroupHeaders,
            onChange: config.onChange
        };
        // Merge data attributes with passed config, giving priority to data attributes
        const mergedConfig = {
            ...config,
            ...dataConfig
        };

        let hierarchyData;
        let initialValue = {};

        if (element.dataset.source) {
            hierarchyData = window[element.dataset.source];
        } else {
            const parsed = MultipleSelectHierarchy.parseSelectOptions(element);
            hierarchyData = parsed.data;
            initialValue = parsed.selectedValues;
        }
        
        // Replace the select element with a div
        const container = document.createElement('div');
        container.className = element.className;
        container.id = element.id;
        container.name = element.name;
        element.parentNode.replaceChild(container, element);
        console.log('hierarchyData :>> ', hierarchyData);
        const instance = new MultipleSelectHierarchy(container, hierarchyData, {
            ...mergedConfig,
            value: JSON.stringify(initialValue)
        });

        return instance;
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("reset", (event) => {
      MultipleSelectHierarchy.resetBySelector(
        event.target,
        ".hierarchy-select"
      );
    });
  });
});

window.MultipleSelectHierarchy = MultipleSelectHierarchy;