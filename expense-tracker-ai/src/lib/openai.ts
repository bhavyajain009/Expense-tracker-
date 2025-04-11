import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Allow client-side usage
});

export type CategoryResult = {
  category: string;
  subcategory: string;
};

/**
 * Categorize expense description using OpenAI
 */
export async function categorizeExpense(description: string): Promise<CategoryResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: "You are a smart expense tracking assistant. Based on the user's input, return the most appropriate category and subcategory. Output only a JSON object like: { 'category': 'Food', 'subcategory': 'Groceries' }"
        },
        {
          role: 'user',
          content: description
        }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { category: 'others', subcategory: '' };
    }
    
    // Extract JSON from response
    try {
      const jsonMatch = content.match(/\{.*\}/s);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          category: result.category?.toLowerCase() || 'others',
          subcategory: result.subcategory || ''
        };
      }
    } catch (error) {
      console.error('Error parsing JSON from OpenAI response:', error);
    }
    
    // Fallback to simple categorization if parsing fails
    return simpleCategorizeFallback(description);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return simpleCategorizeFallback(description);
  }
}

/**
 * Predict expenses for next month using OpenAI
 */
export async function predictExpenses(monthlyData: { month: string; total: number }[]): Promise<number> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: "You are a financial analyst. Based on the monthly expense data provided, predict the total expenses for the next month. Return only a number without any additional text."
        },
        {
          role: 'user',
          content: `Monthly expense data for the past months: ${JSON.stringify(monthlyData)}. Predict the total expenses for the next month.`
        }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content) {
      // Return average if prediction fails
      return monthlyData.reduce((sum, month) => sum + month.total, 0) / monthlyData.length;
    }
    
    // Extract number from response
    const numberMatch = content.match(/\d+(\.\d+)?/);
    if (numberMatch) {
      return parseFloat(numberMatch[0]);
    }
    
    // Fallback to average if parsing fails
    return monthlyData.reduce((sum, month) => sum + month.total, 0) / monthlyData.length;
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Return average if prediction fails
    return monthlyData.reduce((sum, month) => sum + month.total, 0) / monthlyData.length;
  }
}

/**
 * Process voice input to extract expense details
 */
export async function processVoiceInput(text: string): Promise<{
  description: string;
  amount: number;
  date: string;
  category?: string;
  subcategory?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: "You are a voice processing assistant for an expense tracker. Extract the expense description, amount, and date from the user's voice input. Output only a JSON object with the extracted information."
        },
        {
          role: 'user',
          content: text
        }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    // Extract JSON from response
    try {
      const jsonMatch = content.match(/\{.*\}/s);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          description: result.description || '',
          amount: parseFloat(result.amount) || 0,
          date: result.date || new Date().toISOString().split('T')[0],
          category: result.category?.toLowerCase(),
          subcategory: result.subcategory
        };
      }
    } catch (error) {
      console.error('Error parsing JSON from OpenAI response:', error);
    }
    
    throw new Error('Failed to extract expense details');
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

/**
 * Process OCR text from receipt to extract expense details
 */
export async function processReceiptOCR(ocrText: string): Promise<{
  description: string;
  amount: number;
  date: string;
  category?: string;
  subcategory?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: "You are a receipt processing assistant. Extract the vendor name (as description), total amount, and date from the OCR text of a receipt. Also suggest a category and subcategory. Output only a JSON object with the extracted information."
        },
        {
          role: 'user',
          content: ocrText
        }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    // Extract JSON from response
    try {
      const jsonMatch = content.match(/\{.*\}/s);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          description: result.description || '',
          amount: parseFloat(result.amount) || 0,
          date: result.date || new Date().toISOString().split('T')[0],
          category: result.category?.toLowerCase(),
          subcategory: result.subcategory
        };
      }
    } catch (error) {
      console.error('Error parsing JSON from OpenAI response:', error);
    }
    
    throw new Error('Failed to extract receipt details');
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

/**
 * Process chat query to analyze expenses
 */
export async function processExpenseQuery(
  query: string, 
  expenses: { description: string; amount: number; date: string; category: string; subcategory: string }[]
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: "You are an expense analysis assistant. Answer questions about the user's expense data. Be concise and focus on providing insights and data. If appropriate, suggest ways to optimize spending habits."
        },
        {
          role: 'user',
          content: `Expenses data: ${JSON.stringify(expenses)}\nQuestion: ${query}`
        }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return "I couldn't analyze your expenses at this time. Please try again.";
    }
    
    return content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return "I couldn't analyze your expenses at this time due to an error. Please try again.";
  }
}

/**
 * Simple fallback categorization function for when OpenAI API fails
 */
function simpleCategorizeFallback(description: string): CategoryResult {
  const lowerDesc = description.toLowerCase();
  
  // Food-related keywords
  const foodKeywords = ['food', 'grocery', 'restaurant', 'pizza', 'burger', 'lunch', 'dinner', 'breakfast', 
    'café', 'coffee', 'snack', 'meal', 'takeout', 'delivery', 'swiggy', 'zomato', 'dining'];
    
  // Travel-related keywords
  const travelKeywords = ['travel', 'uber', 'ola', 'cab', 'taxi', 'flight', 'bus', 'train', 'petrol', 'fuel', 
    'gas', 'ticket', 'transport', 'metro', 'commute', 'parking', 'toll'];
    
  // Friends/social-related keywords
  const friendsKeywords = ['friend', 'movie', 'party', 'gift', 'treat', 'celebration', 'outing', 'drinks', 
    'hangout', 'wedding', 'event', 'social', 'entertainment', 'pub', 'bar'];
  
  // Check description against keywords
  for (const keyword of foodKeywords) {
    if (lowerDesc.includes(keyword)) return { category: 'food', subcategory: '' };
  }
  
  for (const keyword of travelKeywords) {
    if (lowerDesc.includes(keyword)) return { category: 'travel', subcategory: '' };
  }
  
  for (const keyword of friendsKeywords) {
    if (lowerDesc.includes(keyword)) return { category: 'friends', subcategory: '' };
  }
  
  // Default category
  return { category: 'others', subcategory: '' };
} 