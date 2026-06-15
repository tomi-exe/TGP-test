const delaysByAttempt = [0, 500, 1500];

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function retryAsync(operation, maxAttempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const delay = delaysByAttempt[attempt - 1] ?? delaysByAttempt[delaysByAttempt.length - 1];

    if (delay > 0) {
      await wait(delay);
    }

    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      console.error(`Intento ${attempt} fallido:`, error.message);
    }
  }

  lastError.attempts = maxAttempts;
  throw lastError;
}
