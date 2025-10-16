/**
 * Retry logic for RPC calls with exponential backoff
 * Helps handle rate limiting from RPC providers
 */

export const withRetry = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a rate limit error
      const isRateLimit = 
        error?.message?.includes('429') ||
        error?.message?.includes('rate limit') ||
        error?.code === 429;
      
      // If it's a rate limit error and we have retries left, wait and retry
      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For non-rate-limit errors or last attempt, throw immediately
      throw error;
    }
  }
  
  throw lastError;
};

/**
 * Batch multiple promises with a delay between batches
 * Helps avoid hitting rate limits when making many calls
 */
export const batchPromises = async (promises, batchSize = 5, delayMs = 100) => {
  const results = [];
  
  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    
    // Add delay between batches (except for last batch)
    if (i + batchSize < promises.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
};
