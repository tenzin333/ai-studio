import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import GenerateImage from '../src/components/Upload';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../src/context/ThemeContext';
import { useGenerate } from '../src/hooks/useGenerate';

// Mock useGenerate hook
const mockGenerate = vi.fn();
const mockAbort = vi.fn();
const mockFetchGenerations = vi.fn();
const mockLoadGeneration = vi.fn();
const mockSetGenerations = vi.fn();
const mockSetCurrentGeneration = vi.fn();

// Helper to create mock return values
const createMockHookReturn = (overrides = {}) => ({
  generate: mockGenerate,
  abort: mockAbort,
  fetchGenerations: mockFetchGenerations,
  loadGeneration: mockLoadGeneration,
  isLoading: false,
  isRetrying: false,
  retryCount: 0,
  generations: [],
  currentGeneration: null,
  setGenerations: mockSetGenerations,
  setCurrentGeneration: mockSetCurrentGeneration,
  ...overrides,
});

vi.mock('../src/hooks/useGenerate', () => ({
  useGenerate: vi.fn(() => createMockHookReturn()),
}));

// Helper to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('GenerateImage Component', () => {
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    // Reset mock to default return value
    vi.mocked(useGenerate).mockReturnValue(createMockHookReturn());
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    it('should render upload area', () => {
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      expect(screen.getByText(/Upload Image/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Upload image file/i)).toBeInTheDocument();
    });

    it('should render prompt textarea', () => {
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      expect(screen.getByLabelText(/Prompt/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Describe how you want to transform/i)).toBeInTheDocument();
    });

    it('should render style selector', () => {
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      expect(screen.getByLabelText(/Select image style/i)).toBeInTheDocument();
      expect(screen.getByText(/Realistic - Photorealistic style/i)).toBeInTheDocument();
    });

    it('should render generate button', () => {
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      expect(screen.getByRole('button', { name: /Generate image/i })).toBeInTheDocument();
    });

    it('should render disabled generate button initially', () => {
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      const generateButton = screen.getByRole('button', { name: /Generate image/i });
      expect(generateButton).toBeDisabled();
    });
  });

  describe('File Upload', () => {
    it('should show preview after file upload', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByAltText(/Preview of uploaded image/i)).toBeInTheDocument();
      });
    });

    it('should show remove button on file preview', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Remove uploaded image/i)).toBeInTheDocument();
      });
    });

    it('should remove preview when remove button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
      
      await user.upload(input, file);
      
      const removeButton = await screen.findByLabelText(/Remove uploaded image/i);
      await user.click(removeButton);
      
      await waitFor(() => {
        expect(screen.queryByAltText(/Preview of uploaded image/i)).not.toBeInTheDocument();
      });
    });

    it('should show error for invalid file type', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Invalid file type/i);
      });
    });

    it('should show error for oversized file', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      // Create a file larger than 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
      
      await user.upload(input, largeFile);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/exceeds 10MB/i);
      });
    });
  });

  describe('Generate Flow', () => {
    it('should enable button when prompt and file are provided', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      // Add prompt
      const promptInput = screen.getByLabelText(/Prompt/i);
      await user.type(promptInput, 'A beautiful sunset');
      
      // Upload file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: /Generate image/i });
        expect(generateButton).not.toBeDisabled();
      });
    });

    it('should show loading state during generation', async () => {
      // Mock loading state
      vi.mocked(useGenerate).mockReturnValue(createMockHookReturn({
        isLoading: true,
      }));
      
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      expect(screen.getByText(/Generating.../i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Abort image generation/i })).toBeInTheDocument();
    });

    it('should show retry count during generation', async () => {
      vi.mocked(useGenerate).mockReturnValue(createMockHookReturn({
        isLoading: true,
        retryCount: 2,
      }));
      
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      expect(screen.getByText(/Retry 2\/3/i)).toBeInTheDocument();
    });

    it('should show current generation after success', async () => {
      const mockGeneration = {
        id: '1',
        prompt: 'Test prompt',
        style: 'realistic',
        imageUrl: '/images/test.jpg',
        timestamp: new Date().toISOString(),
      };
      
      vi.mocked(useGenerate).mockReturnValue(createMockHookReturn({
        currentGeneration: mockGeneration,
      }));
      
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      expect(screen.getByText(/Latest Generation/i)).toBeInTheDocument();
      expect(screen.getByAltText(/Generated image/i)).toBeInTheDocument();
      expect(screen.getByText(/Test prompt/i)).toBeInTheDocument();
    });

    it('should call abort when abort button clicked', async () => {
      const user = userEvent.setup();
      
      vi.mocked(useGenerate).mockReturnValue(createMockHookReturn({
        isLoading: true,
      }));
      
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      const abortButton = screen.getByRole('button', { name: /Abort image generation/i });
      await user.click(abortButton);
      
      expect(mockAbort).toHaveBeenCalledTimes(1);
    });
  });

  describe('Generation History', () => {
    it('should display generation history', () => {
      const mockGenerations = [
        {
          id: '1',
          prompt: 'First generation',
          style: 'realistic',
          imageUrl: '/images/1.jpg',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          prompt: 'Second generation',
          style: 'anime',
          imageUrl: '/images/2.jpg',
          timestamp: new Date().toISOString(),
        },
      ];
      
      vi.mocked(useGenerate).mockReturnValue(createMockHookReturn({
        generations: mockGenerations,
      }));
      
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      expect(screen.getByText(/First generation/i)).toBeInTheDocument();
      expect(screen.getByText(/Second generation/i)).toBeInTheDocument();
    });

    it('should show empty state when no generations', () => {
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      expect(screen.getByText(/No generations yet/i)).toBeInTheDocument();
    });

    it('should load generation when history item clicked', async () => {
      const user = userEvent.setup();
      const mockGenerations = [
        {
          id: '1',
          prompt: 'Test prompt',
          style: 'realistic',
          imageUrl: '/images/1.jpg',
          timestamp: new Date().toISOString(),
        },
      ];
      
      vi.mocked(useGenerate).mockReturnValue(createMockHookReturn({
        generations: mockGenerations,
      }));
      
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      const historyButton = screen.getByRole('button', { name: /Load generation/i });
      await user.click(historyButton);
      
      expect(mockLoadGeneration).toHaveBeenCalledWith(mockGenerations[0]);
    });
  });

  describe('Error Handling', () => {
    it('should show error message when prompt is empty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      // Upload file only
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/File upload input/i) as HTMLInputElement;
      await user.upload(fileInput, file);
      
      // Try to submit
      const generateButton = screen.getByRole('button', { name: /Generate image/i });
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Please enter a prompt/i);
      });
    });

    it('should show error message when file is missing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      // Add prompt only
      const promptInput = screen.getByLabelText(/Prompt/i);
      await user.type(promptInput, 'Test prompt');
      
      // Try to submit
      const generateButton = screen.getByRole('button', { name: /Generate image/i });
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Please upload an image/i);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      expect(screen.getByLabelText(/Prompt/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Select image style/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Upload image file/i)).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      const promptLabel = screen.getByText(/Prompt/i).closest('label');
      const uploadLabel = screen.getByText(/Upload Image/i).closest('label');
      
      expect(promptLabel).toHaveTextContent('*');
      expect(uploadLabel).toHaveTextContent('*');
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GenerateImage onLogout={mockOnLogout} />);
      
      // Tab through elements
      await user.tab();
      expect(screen.getByLabelText(/Prompt/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/Select image style/i)).toHaveFocus();
    });
  });
});