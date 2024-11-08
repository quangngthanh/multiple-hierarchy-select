# Multiple Select Examples

A customizable hierarchical select component that supports grouped options, search functionality, and multiple selection patterns.

## Features
- Multiple selection with maximum limit
- Grouped and hierarchical options
- Search functionality 
- Customizable placeholders and labels
- Form integration
- Responsive design
- Data attributes configuration

## Usage

Add the select element with the `hierarchy-select` class:

```html
<select class="form-select hierarchy-select" multiple>
    <!-- Options structure -->
</select>
```

### Basic Example
```html
<select class="form-select hierarchy-select" 
    data-max-selections="3"
    data-placeholder="Select items"
    data-search-placeholder="Search..."
    multiple>
    <option data-group-tag-open></option>
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
    <option value="option3">Option 3</option>
    <option data-group-tag-close></option>
</select>
```

### Grouped Example
```html
<select class="form-select hierarchy-select" multiple>
    <option value="0" data-group-tag-open label="Group 1"></option>
        <option value="1">Item 1</option>
        <option value="2">Item 2</option>
        <option value="3">Item 3</option>
    <option value="0" data-group-tag-close></option>
</select>
```

### Hierarchical Example
```html
<select class="hierarchy-select" multiple>
    <option value="1" data-group-tag-open label="Parent"></option>
        <option value="2" data-subgroup-tag-open label="Child Group"></option>
            <option value="3">Item 1</option>
            <option value="4">Item 2</option>
        <option value="2" data-subgroup-tag-close></option>
    <option value="1" data-group-tag-close></option>
</select>
```

## Configuration Options

Configure the select using data attributes:

| Attribute | Description | Default |
|-----------|-------------|---------|
| data-max-selections | Maximum number of selections allowed | No limit |
| data-placeholder | Main placeholder text | "Select" |
| data-search-placeholder | Search input placeholder | "Search..." |
| data-default-selection-text | Text shown when nothing selected | "Select items" |
| data-unit-child-text | Text for child items | "Items" |
| data-all-text | Text for "select all" option | "All" |
| data-show-group-headers | Show/hide group headers | true |
| data-show-search-box | Show/hide search functionality | true |
| data-show-card-title | Show/hide card title | true |
| data-output-format | Output format ("flat" or "hierarchical") | "hierarchical" |

## Special Option Attributes

| Attribute | Description |
|-----------|-------------|
| data-group-tag-open | Marks start of a group |
| data-group-tag-close | Marks end of a group |
| data-subgroup-tag-open | Marks start of a subgroup |
| data-subgroup-tag-close | Marks end of a subgroup |
| label | Group/subgroup label |

## Dependencies
- Bootstrap 5.x CSS
- Custom styles (styles.css)

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License