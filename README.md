# Multiple Select Hierarchy Component

A customizable hierarchical select component with search functionality and group header options.

## Features
- Hierarchical selection with groups and subgroups
- Search functionality with diacritics support
- Customizable group headers
- Responsive chip display
- Form integration
- Maximum selection limit
- Smooth scrolling

## Installation

1. Include the necessary CSS files in your HTML:
```html
<link href="bootstrap.css" rel="stylesheet">
<link href="styles.css" rel="stylesheet">
```

2. Add the container to your HTML:
```html
<div class="hierarchy-select-container"></div>
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
    id: "region1",
    name: "North Region",
    children: [
      {
        id: "city1",
        name: "New York",
        children: [
          { id: "district1", name: "Manhattan" },
          { id: "district2", name: "Brooklyn" }
        ]
      }
    ]
  }
];

new MultipleSelectHierarchy(container, data, {
  maxSelections: 3,
  showGroupHeaders: true
});
```

## Working with Forms

```html
<form id="myForm">
  <div class="hierarchy-select-container"></div>
  <button type="reset">Reset</button>
  <button type="submit">Submit</button>
</form>

<script>
document.getElementById('myForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const selectedValues = JSON.parse(formData.get('selected-items'));
  console.log(selectedValues);
});
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| maxSelections | number | 3 | Maximum number of parent items that can be selected |
| placeholder | string | "Please select" | Placeholder text for the input |
| searchPlaceholder | string | "Search" | Placeholder text for the search input |
| showGroupHeaders | boolean | true | Show/hide group headers in the dropdown |
| allText | string | "All" | Text for the "All" option |
| clearAllText | string | "Clear all" | Text for the clear all button |
| selectedText | string | "You have selected {n} items" | Text template for selection count |
| defaultSelectionText | string | "Please select items" | Default text when nothing is selected |
| unitChildText | string | "Items" | Text for unit of child items |

## Selection Value Format

### With Group Headers (showGroupHeaders: true)
```javascript
{
  "region1": {
    "children": {
      "city1": {
        "children": {
          "district1": null,  // All selected
          "district2": [1, 2] // Specific items selected
        }
      }
    }
  }
}
```

### Without Group Headers (showGroupHeaders: false)
```javascript
{
  "city1": {
    "children": {
      "district1": null,
      "district2": [1, 2]
    }
  }
}
```

## Methods

### Initialize
```javascript
const hierarchy = new MultipleSelectHierarchy(element, data, options);
```

### Update Items
```javascript
hierarchy.setItems(newData);
```

### Reset
```javascript
hierarchy.reset();
```

### Destroy
```javascript
hierarchy.destroy();
```

## Events

The component automatically handles:
- Form reset events
- Click outside to close
- Search input changes
- Selection changes
- Navigation between levels

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Styling

The component uses CSS variables for easy customization:
```css
.multiple-select-hierarchy {
  --msh-primary-color: #0d6efd;
  --msh-border-color: #dee2e6;
  --msh-text-color: #212529;
  --msh-bg-color: #fff;
}
```

## License

MIT License