import { useState } from 'react';
import type { Expense } from '@/pages/index';

interface ExpensesListProps {
  expenses: Expense[];
}

export default function ExpensesList({ expenses }: ExpensesListProps) {
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
  });
  
  // Toggle sort
  const toggleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Get category badge style
  const getCategoryBadgeClass = (category: string) => {
    const baseClass = 'category-badge';
    switch (category) {
      case 'food':
        return `${baseClass} bg-red-500`;
      case 'travel':
        return `${baseClass} bg-blue-500`;
      case 'friends':
        return `${baseClass} bg-yellow-500`;
      default:
        return `${baseClass} bg-green-500`;
    }
  };
  
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-dark border-b border-light pb-3 mb-4">Recent Expenses</h2>
      
      {/* Sort Controls */}
      <div className="flex mb-4 text-sm">
        <button
          onClick={() => toggleSort('date')}
          className={`flex items-center mr-4 ${sortBy === 'date' ? 'font-bold' : ''}`}
        >
          Date
          {sortBy === 'date' && (
            <span className="ml-1">
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
        
        <button
          onClick={() => toggleSort('amount')}
          className={`flex items-center ${sortBy === 'amount' ? 'font-bold' : ''}`}
        >
          Amount
          {sortBy === 'amount' && (
            <span className="ml-1">
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
      </div>
      
      {/* Expenses List */}
      <div className="expense-list max-h-80 overflow-y-auto">
        {sortedExpenses.length > 0 ? (
          sortedExpenses.map(expense => (
            <div key={expense.id} className="expense-item grid grid-cols-[3fr_1fr_1fr] border-b py-3">
              <div>
                <div className="font-medium">{expense.description}</div>
                {expense.subcategory && (
                  <div className="subcategory text-xs bg-gray-100 inline-block px-1 rounded">
                    {expense.subcategory}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  {new Date(expense.date).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex items-center">
                <span className={getCategoryBadgeClass(expense.category)}>
                  {expense.category}
                </span>
              </div>
              
              <div className="text-right font-medium">
                ₹{expense.amount.toFixed(2)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">No expenses found</p>
        )}
      </div>
    </div>
  );
}