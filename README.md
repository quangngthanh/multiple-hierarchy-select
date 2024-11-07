# Multiple Select Hierarchy Component

A customizable hierarchical select component with search functionality, group headers, and chip display.

## Features
- Multi-level hierarchical selection
- Search functionality with diacritics support
- Customizable group headers
- Responsive chip display with ellipsis
- Maximum selection limit
- Form integration
- Smooth scrolling and navigation
- Back/forward navigation between levels
- Clear all functionality
- Keyboard accessibility

## Installation

1. Include the required CSS files:
```html
<link href="bootstrap.css" rel="stylesheet">
<link href="styles.css" rel="stylesheet">
```

2. Add the container element:
```html
<div class="hierarchy-select-container" data-name="selected-items"></div>
```

3. Include the JavaScript:
```html
<script src="script.js"></script>
```

## Basic Usage

```javascript
const container = document.querySelector(".hierarchy-select-container");
const data = [
  {
    id: 1,
    name: "Group 1",
    children: [
      {
        id: 2,
        name: "Subgroup 1",
        children: [
          { id: 3, name: "Item 1" },
          { id: 4, name: "Item 2" }
        ]
      }
    ]
  }
];

const hierarchy = new MultipleSelectHierarchy(container, data, {
  maxSelections: 3,
  onChange: (value) => console.log('Selected:', value)
});
```

## Data Structure

```javascript
const data = [
  {
    id: "unique_id",        // Required: Unique identifier
    name: "Display Name",   // Required: Display text
    children: [            // Optional: Array of child items
      {
        id: "child_id",
        name: "Child Name",
        children: []       // Can be nested further
      }
    ]
  }
];
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| maxSelections | number | 3 | Maximum number of parent items that can be selected |
| placeholder | string | "Please select" | Main input placeholder |
| searchPlaceholder | string | "Search" | Search input placeholder |
| showGroupHeaders | boolean | true | Toggle group header visibility |
| allText | string | "All" | Text for "select all" option |
| clearAllText | string | "Clear" | Text for clear button |
| selectedText | string | "You have selected {n} items" | Selection count text ({n} is replaced with count) |
| defaultSelectionText | string | "Please select items" | Text shown when nothing is selected |
| unitChildText | string | "Items" | Unit text for child items count |
| onChange | function | null | Callback function when selection changes |

## Methods

### setValue(value)
Set selected items programmatically
```javascript
hierarchy.setValue({
  "group1": {
    "subgroup1": null  // null means all children selected
  }
});
```

### reset()
Clear all selections
```javascript
hierarchy.reset();
```

### destroy()
Remove event listeners and clean up
```javascript
hierarchy.destroy();
```

### setItems(items)
Update the component's data
```javascript
hierarchy.setItems(newData);
```

## Form Integration

```html
<form id="myForm">
  <div class="hierarchy-select-container" data-name="locations"></div>
  <button type="reset">Reset</button>
  <button type="submit">Submit</button>
</form>

<script>
document.getElementById('myForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const selectedLocations = JSON.parse(formData.get('locations'));
  console.log(selectedLocations);
});
</script>
```

## Output Format

The selected values are stored in JSON format:

```javascript
{
  "groupId": {                // Parent group ID
    "subgroupId": {          // Subgroup ID
      "childId": null,       // null = all items selected
      "childId2": [1, 2, 3]  // Array = specific items selected
    }
  }
}
```

## Styling

Customize appearance using CSS variables:
```css
.multiple-select-hierarchy {
  --msh-primary-color: #0d6efd;
  --msh-border-color: #dee2e6;
  --msh-text-color: #212529;
  --msh-bg-color: #fff;
  --msh-hover-bg: #f8f9fa;
  --msh-chip-bg: #e9ecef;
}
```

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - feel free to use in personal and commercial projects.