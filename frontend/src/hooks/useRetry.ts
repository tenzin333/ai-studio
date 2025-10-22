// /frontend/src/hooks/useRetry.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (retryCount: number) => void;
  onMaxRetriesReached?: () => void;
}

export const useRetry = (options: UseRetryOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const shouldRetry = useCallback((error: Error): boolean => {
    // Check if it's a retryable error
    return error.message === 'MODEL_OVERLOADED' && retryCount < maxRetries - 1;
  }, [retryCount, maxRetries]);

  const executeWithRetry = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      errorCheck?: (error: Error) => boolean
    ): Promise<T> => {
      try {
        const result = await fn();
        // Reset retry count on success
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error: any) {
        const isRetryable = errorCheck ? errorCheck(error) : shouldRetry(error);

        if (isRetryable) {
          const currentRetry = retryCount + 1;
          setRetryCount(currentRetry);
          setIsRetrying(true);

          toast.error(
            `Model is currently overloaded. Retrying... (${currentRetry}/${maxRetries})`,
            {
              action: {
                label: 'Retry Now',
                onClick: () => {
                  // Trigger immediate retry
                  setIsRetrying(false);
                  return executeWithRetry(fn, errorCheck);
                },
              },
            }
          );

          onRetry?.(currentRetry);

          // Auto-retry after delay
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return executeWithRetry(fn, errorCheck);
        } else {
          // Max retries reached or non-retryable error
          if (retryCount >= maxRetries - 1 && error.message === 'MODEL_OVERLOADED') {
            toast.error('Model is overloaded. Maximum retries reached. Please try again later.');
            onMaxRetriesReached?.();
          }
          
          setRetryCount(0);
          setIsRetrying(false);
          throw error;
        }
      }
    },
    [retryCount, maxRetries, retryDelay, shouldRetry, onRetry, onMaxRetriesReached]
  );

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  const manualRetry = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setRetryCount((prev) => prev + 1);
      setIsRetrying(true);
      return executeWithRetry(fn);
    },
    [executeWithRetry]
  );

  return {
    retryCount,
    isRetrying,
    executeWithRetry,
    reset,
    manualRetry,
    shouldRetry,
  };
};