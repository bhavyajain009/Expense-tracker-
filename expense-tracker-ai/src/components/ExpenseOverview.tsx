import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { predictExpensesWithTF } from '@/lib/tensorflow';
import { predictExpenses } from '@/lib/openai';
import type { Expense } from '@/pages/index';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

interface ExpenseOverviewProps {
  expenses: Expense[];
  selectedMonth: string;
  selectedYear: string;
  setSelectedMonth: (month: string) => void;
  setSelectedYear: (year: string) => void;
  onExportCSV: () => void;
  onClearData: () => void;
}

export default function ExpenseOverview({
  expenses,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  onExportCSV,
  onClearData
}: ExpenseOverviewProps) {
  const [categoryTotals, setCategoryTotals] = useState<{[key: string]: number}>({});
  const [monthlyData, setMonthlyData] = useState<{month: string; total: number}[]>([]);
  const [predictedExpense, setPredictedExpense] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionMethod, setPredictionMethod] = useState<'tensorflow' | 'openai'>('tensorflow');
  
  // Get current year for year dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => (currentYear - 5 + i).toString());
  
  // Calculate category totals
  useEffect(() => {
    const totals = expenses.reduce((acc, expense) => {
      const category = expense.category || 'others';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as {[key: string]: number});
    
    setCategoryTotals(totals);
  }, [expenses]);
  
  // Calculate monthly data
  useEffect(() => {
    // Group all expenses by month-year
    const allExpenses = JSON.parse(localStorage.getItem('expenses') || '[]') as Expense[];
    
    // Group by year-month
    const grouped = allExpenses.reduce((acc, expense) => {
      const date = new Date(expense.date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!acc[key]) {
        acc[key] = {
          month: `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`,
          total: 0
        };
      }
      
      acc[key].total += expense.amount;
      return acc;
    }, {} as {[key: string]: {month: string; total: number}});
    
    // Convert to array and sort by date
    const data = Object.values(grouped).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      
      if (aYear === bYear) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(aMonth) - months.indexOf(bMonth);
      }
      
      return parseInt(aYear) - parseInt(bYear);
    });
    
    setMonthlyData(data);
  }, [expenses]);
  
  // Predict next month's expenses
  const predictNextMonth = async () => {
    if (monthlyData.length < 2) {
      alert('Need at least 2 months of data for prediction');
      return;
    }
    
    setIsPredicting(true);
    
    try {
      let prediction: number;
      
      if (predictionMethod === 'tensorflow') {
        prediction = await predictExpensesWithTF(monthlyData);
      } else {
        prediction = await predictExpenses(monthlyData);
      }
      
      setPredictedExpense(prediction);
    } catch (error) {
      console.error('Prediction error:', error);
      alert('Failed to predict expenses');
    } finally {
      setIsPredicting(false);
    }
  };
  
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-dark border-b border-light pb-3 mb-4">Expense Overview</h2>
      
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="all">All Months</option>
            <option value="0">January</option>
            <option value="1">February</option>
            <option value="2">March</option>
            <option value="3">April</option>
            <option value="4">May</option>
            <option value="5">June</option>
            <option value="6">July</option>
            <option value="7">August</option>
            <option value="8">September</option>
            <option value="9">October</option>
            <option value="10">November</option>
            <option value="11">December</option>
          </select>
        </div>
        
        <div className="flex-1">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Category Chart */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Category Breakdown</h3>
        <div className="h-64">
          <Pie
            data={{
              labels: Object.keys(categoryTotals).map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
              datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: [
                  '#FF6384', // Food
                  '#36A2EB', // Travel
                  '#FFCE56', // Friends
                  '#4BC0C0'  // Others
                ]
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />
        </div>
      </div>
      
      {/* Monthly Trend & Prediction */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Monthly Trend & Prediction</h3>
          <div className="flex items-center gap-2">
            <select
              value={predictionMethod}
              onChange={(e) => setPredictionMethod(e.target.value as 'tensorflow' | 'openai')}
              className="text-sm p-1 border rounded"
            >
              <option value="tensorflow">TensorFlow</option>
              <option value="openai">OpenAI</option>
            </select>
            <button
              onClick={predictNextMonth}
              disabled={isPredicting || monthlyData.length < 2}
              className="text-sm bg-secondary text-white py-1 px-2 rounded"
            >
              {isPredicting ? 'Predicting...' : 'Predict Next Month'}
            </button>
          </div>
        </div>
        
        <div className="h-64">
          {monthlyData.length > 0 ? (
            <Line
              data={{
                labels: [...monthlyData.map(d => d.month), predictedExpense ? 'Next Month (Predicted)' : ''],
                datasets: [{
                  label: 'Monthly Expenses',
                  data: [...monthlyData.map(d => d.total), predictedExpense || null],
                  borderColor: '#36A2EB',
                  backgroundColor: 'rgba(54, 162, 235, 0.2)',
                  borderWidth: 2,
                  pointBackgroundColor: monthlyData.map(() => '#36A2EB').concat(predictedExpense ? '#FF6384' : ''),
                  pointRadius: monthlyData.map(() => 4).concat(predictedExpense ? 6 : 0),
                  pointHoverRadius: monthlyData.map(() => 6).concat(predictedExpense ? 8 : 0),
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Amount (₹)'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Month'
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Add expenses to see monthly trends
            </div>
          )}
        </div>
        
        {predictedExpense !== null && (
          <div className="mt-2 p-3 bg-gray-100 rounded-lg">
            <p className="font-semibold">
              Predicted expense for next month: 
              <span className="text-primary ml-2">₹{predictedExpense.toFixed(2)}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Predicted using {predictionMethod === 'tensorflow' ? 'TensorFlow.js machine learning' : 'OpenAI GPT model'}
            </p>
          </div>
        )}
      </div>
      
      {/* Category Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Category Summary</h3>
        {Object.entries(categoryTotals).length > 0 ? (
          <div>
            {Object.entries(categoryTotals).map(([category, total]) => (
              <div
                key={category}
                className={`flex justify-between items-center p-3 mb-2 bg-gray-50 rounded border-l-4 border-${
                  category === 'food' ? 'red-500' :
                  category === 'travel' ? 'blue-500' :
                  category === 'friends' ? 'yellow-500' : 'green-500'
                }`}
              >
                <span className="font-medium capitalize">{category}</span>
                <span className="font-semibold">₹{total.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold mt-4 pt-2 border-t">
              <span>Total</span>
              <span>₹{Object.values(categoryTotals).reduce((sum, val) => sum + val, 0).toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No expenses found for the selected period</p>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onExportCSV} className="btn btn-success">
          Export CSV
        </button>
        <button onClick={onClearData} className="btn btn-danger">
          Clear Data
        </button>
      </div>
    </div>
  );
} 