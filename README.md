# Expense Tracker App

A modern, responsive client-side expense tracker web application built with HTML, CSS, and JavaScript.

## Features

- **Add Expenses:** Enter descriptions, amounts, and dates for your expenses
- **Auto-Categorization:** Expenses are automatically categorized based on keywords
- **Subcategory Details:** Specify what food items or other expenses you're spending on
- **Flexible Filtering:** View expenses by month/year or see all expenses at once
- **Data Visualization:** See expense breakdowns with interactive pie charts
- **Data Export:** Export your expenses as CSV files
- **Local Storage:** All data is stored in your browser's localStorage
- **Responsive Design:** Works on both desktop and mobile devices

## How to Use

1. Simply open the `index.html` file in any modern web browser
2. Enter expense details in the form and click "Add Expense"
3. For Food and Other categories, you'll get a prompt to add specific details about what you spent on
4. View expenses with different filter options:
   - Select "All Months" and "All Years" to see all expenses
   - Select specific month/year combinations for detailed views
5. Export your filtered data as needed

## Auto-Categorization

The app automatically categorizes expenses into:
- **Food:** groceries, restaurants, meals, etc. (with detailed subcategory for specific items)
- **Travel:** uber, flights, petrol, etc.
- **Friends:** movies, gifts, parties, etc.
- **Others:** any expense that doesn't fit other categories (with detailed subcategory for what you spent on)

## Future Improvements

- AI-powered categorization (placeholder already in place)
- Sorting/filtering options
- Budget setting and tracking
- Expense editing and deletion
- Data import from CSV

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Uses Chart.js for data visualization
- All data stored in browser localStorage
- No backend or server-side processing required 