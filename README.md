# Multiple Select Location Component

This project implements a customizable multiple select component for location selection, built with HTML, CSS, and JavaScript.

## Introduction

The Multiple Select Location Component is a versatile and user-friendly tool designed to handle hierarchical selection of locations. It's particularly useful for forms where users need to select multiple locations from a structured list, such as cities and their districts.

Key features include:
- Hierarchical selection of locations
- Search functionality
- Chip-based display of selected items
- Customizable maximum number of selections
- Responsive design
- Easy integration with existing forms

## Features

- Hierarchical selection of locations
- Search functionality
- Chip-based display of selected items
- Responsive design
- Customizable styling

## File Structure

- `index.html`: The main HTML file containing the structure of the component
- `bootstrap.css`: Bootstrap 5.3.3 CSS file for basic styling
- `styles.css`: Custom CSS file for component-specific styling
- `script.js`: JavaScript file containing the component's functionality

## Usage

1. Include the necessary CSS files in your HTML:

```
<link href="bootstrap.css" rel="stylesheet">
<link href="styles.css" rel="stylesheet">
```

2. Add the following HTML structure to your page:

```html
<select class="form-select hierarchy-select" multiple name="location-user-like">
    <option value="1">International</option>
    <optgroup label="Hanoi (TP.Hà Nội)" data-value="2">
        <option value="21">Ba Vi</option>
        <option value="22">Chuong My</option>
        <option value="23">Gia Lam</option>
    </optgroup>
    <!-- Add more options as needed -->
</select>
```

3. Include the JavaScript file at the end of your HTML body:

```html
<script src="script.js"></script>
```

4. Initialize the component:

```javascript
document.addEventListener("DOMContentLoaded", () => {
  const hierarchySelects = document.querySelectorAll("select.hierarchy-select");
  hierarchySelects.forEach((selectElement) => {
    new MultipleSelectHierarchy(selectElement, {
      maxSelections: 3,
      placeholder: "Please select",
      searchPlaceholder: "Search",
    });
  });
});
```

## Resetting the Component

There are two ways to reset the Multiple Select Location Component:

1. **Reset a specific instance:**
   If you have a reference to the MultipleSelectHierarchy instance, you can call its `reset()` method:

   ```javascript
   const instance = new MultipleSelectHierarchy(selectElement, options);
   // ... later in your code ...
   instance.reset();
   ```

2. **Reset by selector:**
   You can reset all instances within a specific container (like a form) using the static `resetBySelector` method:

   ```javascript
   // Reset all instances within a form with id "myForm"
   MultipleSelectHierarchy.resetBySelector('#myForm');

   // Reset all instances on the page
   MultipleSelectHierarchy.resetBySelector('body');
   ```

   This is particularly useful when resetting forms:

   ```javascript
   document.querySelectorAll('form').forEach(form => {
     form.addEventListener('reset', (event) => {
       event.preventDefault();
       MultipleSelectHierarchy.resetBySelector(`#${form.id}`);
       form.reset();
     });
   });
   ```

## Customization

You can customize the appearance of the component by modifying the `styles.css` file. The component uses custom classes prefixed with `.multiple-select-hierarchy` for easy targeting and modification.

## Dependencies

- Bootstrap 5.3.3 (included in `bootstrap.css`)

## Browser Support

This component should work in all modern browsers that support ES6+ JavaScript and CSS3.

## License

[Add your chosen license here]

## Contributing

[Add contribution guidelines if applicable]

## Authors

[Add your name or your team's name]

## Acknowledgments

- Bootstrap team for the base styling framework
