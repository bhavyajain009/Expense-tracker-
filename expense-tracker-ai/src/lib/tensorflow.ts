import * as tf from '@tensorflow/tfjs';

/**
 * Predict expenses for next month using TensorFlow.js linear regression
 */
export async function predictExpensesWithTF(
  monthlyData: { month: string; total: number }[]
): Promise<number> {
  // Need at least 2 data points for prediction
  if (monthlyData.length < 2) {
    return 0;
  }

  try {
    // Convert data to tensors
    const xs = tf.tensor1d(monthlyData.map((_, i) => i));
    const ys = tf.tensor1d(monthlyData.map(d => d.total));

    // Create and train a linear regression model
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
    model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

    // Train the model
    await model.fit(xs, ys, { epochs: 100, verbose: 0 });

    // Predict the next month
    const nextMonthIndex = tf.tensor1d([monthlyData.length]);
    const prediction = model.predict(nextMonthIndex) as tf.Tensor;
    const result = await prediction.data();

    // Clean up tensors
    xs.dispose();
    ys.dispose();
    nextMonthIndex.dispose();
    prediction.dispose();
    model.dispose();

    return result[0];
  } catch (error) {
    console.error('TensorFlow prediction error:', error);
    
    // Fallback to average of last 3 months if available
    if (monthlyData.length >= 3) {
      const lastThreeMonths = monthlyData.slice(-3);
      return lastThreeMonths.reduce((sum, month) => sum + month.total, 0) / 3;
    }
    
    // Otherwise fallback to average of all months
    return monthlyData.reduce((sum, month) => sum + month.total, 0) / monthlyData.length;
  }
} 