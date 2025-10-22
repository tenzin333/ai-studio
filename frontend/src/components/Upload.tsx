import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useGenerate } from '../hooks/useGenerate';

interface Generation {
  id: string;
  prompt: string;
  style: string;
  imageUrl: string;
  timestamp: string;
}

interface GenerateImageProps {
  onLogout: () => void;
}

const STYLE_OPTIONS = [
  { value: 'realistic', label: 'Realistic', description: 'Photorealistic style' },
  { value: 'anime', label: 'Anime', description: 'Japanese animation style' },
  { value: 'oil-painting', label: 'Oil Painting', description: 'Classic painted look' },
  { value: 'watercolor', label: 'Watercolor', description: 'Soft, fluid artistic style' },
  { value: 'digital-art', label: 'Digital Art', description: 'Modern digital illustration' },
  { value: '3d-render', label: '3D Render', description: 'Three-dimensional CGI style' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const GenerateImage = ({ onLogout }: GenerateImageProps) => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<string>('realistic');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const logoutButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const token = localStorage.getItem("token") ?? "";

  const {
    generate,
    abort,
    fetchGenerations,
    loadGeneration: loadGenerationFromHook,
    isLoading,
    retryCount,
    generations,
    currentGeneration,
  } = useGenerate({
    token,
    onSuccess: (generation) => {
      console.log('Generation successful:', generation);
      setError('');
    }
  });

  // Fetch past generations on mount
  useEffect(() => {
    if (!token) {
      toast.error('Please login to access this feature');
      navigate('/login');
      return;
    }
    fetchGenerations();
  }, [token, fetchGenerations, navigate]);

  // Close logout confirmation with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLogoutConfirm) {
        setShowLogoutConfirm(false);
        logoutButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showLogoutConfirm]);

  // Handle clicks outside logout confirmation
  useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-logout-modal]') && !target.closest('[data-logout-button]')) {
        setShowLogoutConfirm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLogoutConfirm]);

  // Focus management for logout dialog
  useEffect(() => {
    if (showLogoutConfirm) {
      cancelButtonRef.current?.focus();
    }
  }, [showLogoutConfirm]);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      onLogout();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      let errorMsg = 'Invalid file type';

      if (rejection.file.size > MAX_FILE_SIZE) {
        errorMsg = 'File exceeds 10MB';
      } else if (!rejection.file.type.match(/^image\/(jpeg|png)$/)) {
        errorMsg = 'Invalid file type';
      }

      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (acceptedFiles.length > 0 && acceptedFiles[0].size > MAX_FILE_SIZE) {
      const errorMsg = 'File exceeds 10MB';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setFiles(acceptedFiles);
    const previewUrls = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false,
    maxSize: MAX_FILE_SIZE,
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!prompt.trim()) {
      const errorMsg = 'Please enter a prompt';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (files.length === 0) {
      const errorMsg = 'Please upload an image';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      await generate({
        prompt,
        style,
        file: files[0],
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMsg);
    }
  };

  const removeFile = () => {
    if (previews.length > 0) {
      URL.revokeObjectURL(previews[0]);
    }
    setFiles([]);
    setPreviews([]);
    setError('');
  };

  const loadGeneration = (generation: Generation) => {
    setPrompt(generation.prompt);
    setStyle(generation.style);
    setError('');
    loadGenerationFromHook(generation);
    toast.success('Generation loaded into workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Logout */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="text-center flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Image Generation Studio
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Transform your images with AI-powered generation</p>
          </div>

          {/* Logout Button */}
          <div className="relative">
            <button
              ref={logoutButtonRef}
              onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-red-300 rounded-xl transition-all shadow-sm hover:shadow-md group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Open logout menu"
              aria-expanded={showLogoutConfirm}
              aria-haspopup="dialog"
              data-logout-button
            // Remove tabIndex={1}
            >
              <span className="text-sm font-semibold text-gray-700 group-hover:text-red-500 transition-colors">
                Logout
              </span>
            </button>

            {/* Logout Confirmation Dialog */}
            {showLogoutConfirm && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-title"
                data-logout-modal
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border-2 border-gray-200 p-4 z-50"
              >
                <p id="logout-title" className="text-sm text-gray-700 mb-3 font-medium">
                  Are you sure you want to logout?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                    aria-label="Confirm logout"
                    data-testid="confirm-logout"
                  >
                    Yes, Logout
                  </button>
                  <button
                    ref={cancelButtonRef}
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="Cancel logout"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <main className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
              <form
                className="flex flex-col gap-5"
                onSubmit={handleGenerate}
                aria-label="Image generation form"
                noValidate
              >
                {/* Error Alert */}
                {error && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                    className="p-4 bg-red-50 border-2 border-red-200 rounded-xl"
                  >
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                  </div>
                )}

                {/* Prompt Input */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="prompt"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <span>Prompt</span>
                    <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <textarea
                    ref={promptRef}
                    id="prompt"
                    name="prompt"
                    className="border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-28 resize-y transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Describe how you want to transform the image..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                    disabled={isLoading}
                    aria-required="true"
                    aria-invalid={error && !prompt ? 'true' : 'false'}
                    tabIndex={0}
                  />
                </div>

                {/* Style Dropdown */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="style"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Style
                  </label>
                  <select
                    id="style"
                    name="style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    disabled={isLoading}
                    className="border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                    aria-label="Select image style"
                  >
                    {STYLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upload Area */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="file-upload"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2 flex-wrap"
                  >
                    <span>Upload Image</span>
                    <span className="text-red-500" aria-label="required">*</span>
                    <span className="text-xs text-gray-500 font-normal">(Max 10MB, JPEG/PNG)</span>
                  </label>

                  {previews.length === 0 ? (
                    <div
                      {...getRootProps()}
                      className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isDragActive
                          ? 'border-blue-500 bg-blue-50 scale-105'
                          : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      role="button"
                      aria-label="Upload image file. Click to browse or drag and drop"
                      tabIndex={isLoading ? -1 : 0}
                    >
                      <input
                        {...getInputProps()}
                        id="file-upload"
                        disabled={isLoading}
                        aria-label="File upload input"
                        aria-required="true"
                        aria-invalid={error && files.length === 0 ? 'true' : 'false'}
                      />
                      <div className="flex flex-col items-center justify-center p-6 pointer-events-none">
                        <div className="w-16 h-16 mb-4 flex items-center justify-center text-4xl text-gray-400">
                          ☁️
                        </div>
                        <p className="mb-2 text-sm sm:text-base font-medium text-gray-700">
                          <span className="text-blue-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">JPEG or PNG (max. 10MB)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <img
                        src={previews[0]}
                        alt="Preview of uploaded image"
                        className="w-full h-80 object-contain rounded-xl border-2 border-gray-200 bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={removeFile}
                        disabled={isLoading}
                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2.5 transition-all disabled:opacity-50 shadow-lg opacity-0 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:opacity-100"
                        aria-label="Remove uploaded image"
                      >
                        ✕
                      </button>
                      <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                        <p className="text-sm truncate">{files[0].name}</p>
                        <p className="text-xs text-gray-300">{(files[0].size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isLoading || !prompt.trim() || files.length === 0}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl py-3.5 font-semibold transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-busy={isLoading}
                    aria-label={isLoading ? `Generating image` : 'Generate image'}
                    aria-live="polite"
                  >
                    {isLoading ? (
                      <>
                        <span className="inline-block animate-spin">⏳</span>
                        <span>Generating... {retryCount > 0 && `Retry ${retryCount}/3`}</span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true">🎨</span>
                        Generate Image
                      </>
                    )}
                  </button>

                  {isLoading && (
                    <button
                      type="button"
                      onClick={abort}
                      className="px-6 bg-red-500 hover:bg-red-600 text-white rounded-xl py-3.5 font-semibold transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label="Abort image generation"
                    >
                      Abort
                    </button>
                  )}
                </div>
              </form>

              {/* Current Generation Result */}
              {currentGeneration && (
                <section
                  className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200"
                  aria-labelledby="latest-generation"
                  aria-live="polite"
                >
                  <h3 id="latest-generation" className="text-lg font-semibold text-green-800 mb-3">Latest Generation</h3>
                  <img
                    src={`${import.meta.env.VITE_BASE_URL}${currentGeneration.imageUrl}`}
                    alt="Generated image"
                    className="w-full h-64 object-contain rounded-lg border border-green-200 bg-white"
                  />
                  <div className="mt-3 text-sm text-gray-700">
                    <p className="font-medium">{currentGeneration.prompt}</p>
                    <p className="text-gray-600">{STYLE_OPTIONS.find(s => s.value === currentGeneration.style)?.label}</p>
                  </div>
                </section>
              )}
            </div>
          </main>

          {/* History Sidebar */}
          <aside className="lg:col-span-1" aria-label="Generation history">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 lg:sticky lg:top-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span aria-hidden="true">📜</span>
                Recent Generations
              </h2>

              {generations.length === 0 ? (
                <div className="text-center py-12 text-gray-400" role="status" aria-label="No generations yet">
                  <div className="text-6xl mb-3 opacity-50">📦</div>
                  <p className="text-sm">No generations yet</p>
                </div>
              ) : (
                <nav aria-label="Generation history list">
                  <ul className="space-y-3 max-h-[600px] overflow-y-auto" role="list">
                    {generations.map((gen) => (
                      <li key={gen.id}>
                        <button
                          onClick={() => loadGeneration(gen)}
                          className="w-full group bg-gray-50 hover:bg-blue-50 rounded-xl p-3 transition-all border-2 border-transparent hover:border-blue-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                          aria-label="Load generation"
                        >
                          <div className="flex gap-3">
                            <img
                              src={`${import.meta.env.VITE_BASE_URL}${gen.imageUrl}`}
                              alt=""
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200 group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
                                {gen.prompt}
                              </p>
                              <p className="text-xs text-gray-500 mb-1">
                                {STYLE_OPTIONS.find(s => s.value === gen.style)?.label}
                              </p>
                              <p className="text-xs text-gray-400">
                                <time dateTime={gen.timestamp}>
                                  {formatTimestamp(gen.timestamp)}
                                </time>
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default GenerateImage;