import Head from 'next/head';
import { useState, useEffect } from 'react';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseOverview from '@/components/ExpenseOverview';
import ExpensesList from '@/components/ExpensesList';
import AIFeaturesPanel from '@/components/AIFeaturesPanel';

export type Expense = {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  subcategory: string;
};

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  
  // Load expenses from localStorage when component mounts
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);
  
  // Filter expenses based on selected month and year
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const monthMatch = selectedMonth === 'all' || expenseDate.getMonth().toString() === selectedMonth;
    const yearMatch = selectedYear === 'all' || expenseDate.getFullYear().toString() === selectedYear;
    return monthMatch && yearMatch;
  });
  
  // Add new expense
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
    };
    
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
  };
  
  // Export expenses to CSV
  const exportToCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('No expenses to export');
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Description,Amount,Category,Subcategory,Date\n";
    
    filteredExpenses.forEach(expense => {
      csvContent += `"${expense.description}",${expense.amount},"${expense.category}","${expense.subcategory || ''}","${expense.date}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    // Set file name based on selected filters
    let fileName = "expenses";
    if (selectedMonth !== 'all') {
      fileName += `_month-${parseInt(selectedMonth) + 1}`;
    }
    if (selectedYear !== 'all') {
      fileName += `_year-${selectedYear}`;
    }
    fileName += ".csv";
    
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Clear all data
  const clearAllData = () => {
    if (confirm('Are you sure you want to delete all expense data? This cannot be undone.')) {
      localStorage.removeItem('expenses');
      setExpenses([]);
    }
  };
  
  return (
    <>
      <Head>
        <title>AI Expense Tracker</title>
        <meta name="description" content="Track your expenses with AI features" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="container mx-auto px-4 py-5">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-dark mb-2">AI Expense Tracker</h1>
          <p className="text-lg">Track, categorize, and visualize your expenses with AI</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <ExpenseForm onAddExpense={addExpense} />
            <AIFeaturesPanel expenses={expenses} />
          </div>
          
          <div>
            <ExpenseOverview 
              expenses={filteredExpenses}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              setSelectedMonth={setSelectedMonth}
              setSelectedYear={setSelectedYear}
              onExportCSV={exportToCSV}
              onClearData={clearAllData}
            />
            
            <ExpensesList expenses={filteredExpenses} />
          </div>
        </div>
      </div>
    </>
  );
} 