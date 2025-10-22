// /frontend/src/hooks/useGenerate.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useRetry } from './useRetry';

interface Generation {
  id: string;
  prompt: string;
  style: string;
  imageUrl: string;
  timestamp: string;
}

interface GenerateParams {
  prompt: string;
  style: string;
  file: File;
}

interface UseGenerateProps {
  token: string;
  onSuccess?: (generation: Generation) => void;
}

const OVERLOAD_CHANCE = 0.2;

export const useGenerate = ({ token, onSuccess }: UseGenerateProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null);

  const {
    retryCount,
    isRetrying,
    executeWithRetry,
    reset: resetRetry,
  } = useRetry({
    maxRetries: 3,
    retryDelay: 2000,
    onRetry: (count) => {
      console.log(`Retrying generation, attempt ${count}`);
    },
    onMaxRetriesReached: () => {
      console.log('Max retries reached for generation');
    },
  });

  const simulateOverload = () => {
    return Math.random() < OVERLOAD_CHANCE;
  };

  const fetchGenerations = useCallback(async () => {
    if (!token) {
      toast.error('Please login to access this feature');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/generations/getGenerate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setGenerations(data.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching generations:', err);
      toast.error('Failed to fetch generations');
    }
  }, [token]);

  const performGeneration = useCallback(
    async (params: GenerateParams, signal: AbortSignal): Promise<Generation> => {
      // Simulate model overload
      if (simulateOverload()) {
        throw new Error('MODEL_OVERLOADED');
      }

      const formData = new FormData();
      formData.append('prompt', params.prompt);
      formData.append('style', params.style);
      formData.append('file', params.file);

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/generations/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal,
      });

      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        throw new Error('UNAUTHORIZED');
      }

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      return data;
    },
    [token]
  );

  const generate = useCallback(
    async (params: GenerateParams) => {
      if (!token) {
        toast.error('Please login to generate images');
        return;
      }

      if (!params.prompt.trim()) {
        toast.error('Please enter a prompt');
        return;
      }

      if (!params.file) {
        toast.error('Please upload an image');
        return;
      }

      // Abort previous request if exists
      if (abortController) {
        abortController.abort();
      }

      // Create new abort controller
      const controller = new AbortController();
      setAbortController(controller);
      setIsLoading(true);

      try {
        // Execute with retry logic
        const data = await executeWithRetry(
          () => performGeneration(params, controller.signal),
          (error) => error.message === 'MODEL_OVERLOADED'
        );

        console.log('Generated data:', data);
        toast.success('Image generated successfully!');
        setCurrentGeneration(data);
        onSuccess?.(data);

        // Refresh generations list
        await fetchGenerations();

        return data;
      } catch (err: any) {
        // Don't show error toast for aborted requests
        if (err.name === 'AbortError') {
          toast.info('Generation aborted');
          resetRetry();
          return;
        }

        // Don't show error for overload (already handled by retry hook)
        if (err.message !== 'MODEL_OVERLOADED') {
          console.error('Generation error:', err);
          toast.error('Error while generating. Please try again.');
        }

        throw err;
      } finally {
        setIsLoading(false);
        setAbortController(null);
      }
    },
    [token, abortController, executeWithRetry, performGeneration, fetchGenerations, onSuccess, resetRetry]
  );

  const abort = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
      resetRetry();
    }
  }, [abortController, resetRetry]);

  const loadGeneration = useCallback((generation: Generation) => {
    setCurrentGeneration(generation);
    return generation;
  }, []);

  return {
    generate,
    abort,
    fetchGenerations,
    loadGeneration,
    isLoading,
    isRetrying,
    retryCount,
    generations,
    currentGeneration,
    setGenerations,
    setCurrentGeneration,
  };
};