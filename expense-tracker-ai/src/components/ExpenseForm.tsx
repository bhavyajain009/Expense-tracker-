import { useState, useEffect, useCallback } from 'react';
import { categorizeExpense, CategoryResult } from '@/lib/openai';
import type { Expense } from '@/pages/index';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

export default function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  
  // AI categorization state
  const [isLoading, setIsLoading] = useState(false);
  const [categorizeError, setCategorizeError] = useState('');
  
  // Smart categorization
  const smartCategorize = useCallback(async (description: string) => {
    if (!description || description.length < 3) return;
    
    try {
      setIsLoading(true);
      setCategorizeError('');
      
      const result = await categorizeExpense(description);
      
      setCategory(result.category);
      if (result.subcategory) {
        setSubcategory(result.subcategory);
      }
    } catch (error) {
      console.error('Categorization error:', error);
      setCategorizeError('Failed to categorize. Using default category.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Trigger categorization when description changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (description.trim().length >= 3) {
        smartCategorize(description);
      }
    }, 500); // Debounce for 500ms
    
    return () => clearTimeout(timer);
  }, [description, smartCategorize]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!date) {
      alert('Please select a date');
      return;
    }
    
    const finalCategory = category || 'others';
    
    // Create expense object
    const newExpense = {
      description: description.trim(),
      amount: amountValue,
      date,
      category: finalCategory,
      subcategory: subcategory.trim()
    };
    
    // Add expense
    onAddExpense(newExpense);
    
    // Clear form
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('');
    setSubcategory('');
  };
  
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-dark border-b border-light pb-3 mb-4">Add New Expense</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <div className="relative">
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you spend on?"
              className="w-full"
            />
            {isLoading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          {categorizeError && <p className="text-danger text-sm mt-1">{categorizeError}</p>}
        </div>
        
        <div className="form-group">
          <label htmlFor="amount">Amount (₹)</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            placeholder="How much did you spend?"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Auto Detect</option>
            <option value="food">Food</option>
            <option value="travel">Travel</option>
            <option value="friends">Friends</option>
            <option value="others">Others</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? 'AI is detecting category...' : 'AI will detect based on description'}
          </p>
        </div>
        
        {(category === 'food' || category === 'others') && (
          <div className="form-group">
            <label htmlFor="subcategory">Subcategory</label>
            <input
              type="text"
              id="subcategory"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder={category === 'food' ? 'E.g., Groceries, Dining' : 'Specify what you spent on'}
            />
          </div>
        )}
        
        <button type="submit" className="btn w-full">Add Expense</button>
      </form>
    </div>
  );
}