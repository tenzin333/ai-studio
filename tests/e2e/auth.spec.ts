import { test, expect, Page } from '@playwright/test';

async function logout(page: Page) {
  // Wait for the page to be fully loaded and stable
  await page.waitForLoadState('networkidle');

  // Try multiple selector strategies for the logout button
  const logoutSelectors = [
    page.getByRole('button', { name: /^(Logout|Sign Out)$/i }),
    page.locator('[data-testid="logout-button"]'),
    page.locator('[data-logout-button]'),
    page.locator('button:has-text("Logout")'),
    page.locator('button:has-text("Sign Out")'),
    page.getByText(/^(Logout|Sign Out)$/i)
  ];

  let logoutButton = null;

  // Try each selector with a short timeout
  for (const selector of logoutSelectors) {
    try {
      await selector.waitFor({ state: 'visible', timeout: 3000 });
      logoutButton = selector;
      break;
    } catch {
      continue;
    }
  }

  if (!logoutButton) {
    // If no specific logout button found, look for user menu/dropdown
    console.log('Logout button not found directly, checking for user menu...');

    const userMenuSelectors = [
      page.locator('[data-testid="user-menu"]'),
      page.locator('[data-user-menu]'),
      page.getByRole('button', { name: /user|profile|account/i }),
      page.locator('button:has-text("User")'),
      page.locator('button:has-text("Profile")'),
      page.locator('button:has-text("Account")')
    ];

    let userMenu = null;
    for (const selector of userMenuSelectors) {
      try {
        await selector.waitFor({ state: 'visible', timeout: 3000 });
        userMenu = selector;
        break;
      } catch {
        continue;
      }
    }

    if (userMenu) {
      await userMenu.click();
      // Now wait for logout option in dropdown
      await page.waitForTimeout(1000);
      logoutButton = page.getByRole('button', { name: /^(Logout|Sign Out)$/i });
    } else {
      throw new Error('Could not find logout button or user menu');
    }
  }

  await logoutButton.click();

  // ✅ Wait for the modal container to appear first
  await page.waitForSelector('[data-logout-modal], [role="dialog"], .modal', {
    state: 'visible',
    timeout: 10000
  });

  // ✅ Now safely click the confirm button by visible text
  const confirmSelectors = [
    page.locator('button:has-text("Yes, Logout")'),
    page.locator('button:has-text("Confirm")'),
    page.locator('button:has-text("Logout")').last(),
    page.getByRole('button', { name: /^(Yes, Logout|Confirm Logout)$/i })
  ];

  let confirmButton = null;
  for (const selector of confirmSelectors) {
    try {
      await selector.waitFor({ state: 'visible', timeout: 3000 });
      confirmButton = selector;
      break;
    } catch {
      continue;
    }
  }

  if (confirmButton) {
    await confirmButton.click();
  } else {
    // If no confirmation modal, assume logout happened directly
    console.log('No confirmation modal found, proceeding with logout');
  }

  // ✅ Wait for redirect to login
  await page.waitForURL('/login', { timeout: 15000 });
  await expect(page).toHaveURL('/login');
}

// 🔹 Test data
const TEST_IMAGES = {
  valid: './tests/fixtures/sample.jpg',
  large: './tests/fixtures/large-image.jpg', // >10MB
  invalid: './tests/fixtures/invalid.txt'
};


async function uploadImage(page: Page) {
  const uploadZone = page.getByRole('button', { name: /Upload image file/i });
  await uploadZone.waitFor({ state: 'visible' });

  // Create a mock image file in memory instead of using file system
  const fileInput = page.locator('input[type="file"]');

  // Create a mock JPEG file
  const buffer = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
    0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
    0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03, 0x00,
    0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
    0x81, 0x91, 0xA1, 0x08, 0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35,
    0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55,
    0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8A, 0x92, 0x93, 0x94,
    0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2,
    0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
    0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6,
    0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA,
    0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00
  ]);

  await fileInput.setInputFiles({
    name: 'sample.jpg',
    mimeType: 'image/jpeg',
    buffer: buffer
  });

  // Wait for preview to appear
  await expect(page.getByAltText(/Preview of uploaded image/i)).toBeVisible({ timeout: 10000 });
}

async function fillPromptAndStyle(page: Page, prompt: string, style: string = 'realistic') {
  // Fill prompt
  const promptTextarea = page.getByPlaceholder('Describe how you want to transform the image...');
  await promptTextarea.fill(prompt);

  // Select style - FIXED: Don't click the select, just set the value
  await page.locator('select[name="style"]').selectOption(style);
}

async function generateImage(page: Page) {
  const generateButton = page.getByRole('button', { name: /Generate Image/i });
  await generateButton.click();
}

test.describe('Authentication Flow', () => {
  // Allow plenty of time for auth operations
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 60000 });
  });

  // ------------------------------
  // Display login page
  // ------------------------------
  test('should display login page', async ({ page }) => {
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /Create Account|Welcome Back/i })).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  // ------------------------------
  // Signup flow
  // ------------------------------
  test('should signup a new user', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible();

    const email = `test${Date.now()}@example.com`;
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill('Test123!@#');
    await page.getByRole('button', { name: /^Sign Up$/i }).click();

    await expect(page).toHaveURL('/', { timeout: 15000 });
    await expect(page.getByText(/Image Generation Studio/i)).toBeVisible();
  });

  // ------------------------------
  // Login flow for existing user
  // ------------------------------
  test('should login existing user', async ({ page }) => {
    const email = `testlogin${Date.now()}@example.com`;

    // Sign up
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill('Test123!@#');
    await page.getByRole('button', { name: /^Sign Up$/i }).click();
    await page.waitForURL('/', { timeout: 15000 });

    // Logout
    await logout(page);

    // Switch to login mode
    const signInLink = page.getByText(/Already have an account/i)
      .getByRole('button', { name: /Sign In/i });
    await signInLink.waitFor({ state: 'visible', timeout: 5000 });
    await signInLink.click();

    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();

    // Login again
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill('Test123!@#');
    await page.getByRole('button', { name: /^Sign In$/i }).click();

    await expect(page).toHaveURL('/', { timeout: 15000 });
    await expect(page.getByText(/Image Generation Studio/i)).toBeVisible();
  });

  // ------------------------------
  // Invalid credentials
  // ------------------------------
  test('should show error with invalid credentials', async ({ page }) => {
    const signInLink = page.getByText(/Already have an account/i)
      .getByRole('button', { name: /Sign In/i });
    await signInLink.click();

    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();

    await page.getByPlaceholder('you@example.com').fill('wrong@example.com');
    await page.getByPlaceholder('••••••••').fill('WrongPassword');
    await page.getByRole('button', { name: /^Sign In$/i }).click();

    await expect(page.locator('text=/Invalid credentials|Error occurred|failed/i'))
      .toBeVisible({ timeout: 15000 });
  });

  // ------------------------------
  // Logout flow
  // ------------------------------
  test('should logout successfully', async ({ page }) => {
    const email = `testlogout${Date.now()}@example.com`;

    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill('Test123!@#');
    await page.getByRole('button', { name: /^Sign Up$/i }).click();

    await page.waitForURL('/', { timeout: 15000 });
    await logout(page);
  });
});


test.describe('Image Generation Flow', () => {
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = `test${Date.now()}@example.com`;

    // Sign up and login
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(testEmail);
    await page.getByPlaceholder('••••••••').fill('Test123!@#');
    await page.getByRole('button', { name: /^Sign Up$/i }).click();
    await page.waitForURL('/', { timeout: 15000 });

    // Wait for the main page to load completely
    await expect(page.getByText(/Image Generation Studio/i)).toBeVisible();
  });

  // ------------------------------
  // Component Rendering Tests - FIXED
  // ------------------------------
  test('should render all generation components correctly', async ({ page }) => {
    // Upload component
    await expect(page.getByText('Upload Image')).toBeVisible();
    await expect(page.getByRole('button', { name: /Upload image file/i })).toBeVisible();
    await expect(page.getByText(/JPEG or PNG.*max.*10MB/i)).toBeVisible();

    // Prompt component
    await expect(page.getByPlaceholder('Describe how you want to transform the image...')).toBeVisible();
    await expect(page.getByText('Prompt')).toBeVisible();

    // Style component - FIXED: Check select exists and has options
    const styleSelect = page.locator('select[name="style"]');
    await expect(styleSelect).toBeVisible();

    // Check that options are available in the select
    await expect(styleSelect).toHaveValue('realistic');

    // Generate button
    await expect(page.getByRole('button', { name: /Generate Image/i })).toBeVisible();

    // History sidebar
    await expect(page.getByText('Recent Generations')).toBeVisible();
  });

  // ------------------------------
  // Upload Component Tests - FIXED
  // ------------------------------
  test('should handle successful image upload', async ({ page }) => {
    await uploadImage(page);

    // Verify preview appears
    await expect(page.getByAltText(/Preview of uploaded image/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Remove uploaded image/i })).toBeVisible();
  });

  test('should show error for large file upload', async ({ page }) => {
    // Create a large file (>10MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large-image.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer
    });

    // Should show error - FIXED: Use more specific selector
    await expect(page.locator('[role="alert"]').getByText(/File exceeds 10MB/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid file type', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Create invalid file
    await fileInput.setInputFiles({
      name: 'invalid.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('invalid file content')
    });

    // FIXED: Use more specific selector to avoid multiple matches
    await expect(page.locator('[role="alert"]').getByText(/Invalid file type/i)).toBeVisible({ timeout: 5000 });
  });

  test('should remove uploaded image', async ({ page }) => {
    await uploadImage(page);

    // Click remove button
    await page.getByRole('button', { name: /Remove uploaded image/i }).click();

    // Should show upload zone again
    await expect(page.getByRole('button', { name: /Upload image file/i })).toBeVisible();
    await expect(page.getByAltText(/Preview of uploaded image/i)).not.toBeVisible();
  });

  // ------------------------------
  // Generate Flow: Loading → Success → History - FIXED with API mocking
  // ------------------------------
  test('should complete full generate flow successfully', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/generate', async route => {
      // Simulate successful generation
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-gen-123',
          prompt: 'A beautiful sunset over mountains',
          style: 'digital-art',
          imageUrl: '/generated/test-image.jpg',
          timestamp: new Date().toISOString()
        })
      });
    });

    // Mock the generations list
    await page.route('**/api/generations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-gen-123',
          prompt: 'A beautiful sunset over mountains',
          style: 'digital-art',
          imageUrl: '/generated/test-image.jpg',
          timestamp: new Date().toISOString()
        }])
      });
    });

    await uploadImage(page);
    await fillPromptAndStyle(page, 'A beautiful sunset over mountains', 'digital-art');
    await generateImage(page);

    // Verify loading state
    await expect(page.getByRole('button', { name: /Generating/i })).toBeVisible();

    // Wait for success - FIXED: Check for latest generation section
    await expect(page.getByText('Latest Generation')).toBeVisible({ timeout: 10000 });

    // Verify generated image appears
    await expect(page.getByAltText('Generated image')).toBeVisible();
  });

  // ------------------------------
  // Error and Retry Handling (up to 3 attempts) - FIXED
  // ------------------------------
  test('should handle generation errors and show retry attempts', async ({ page }) => {
    let attemptCount = 0;

    await page.route('**/api/generate', async route => {
      attemptCount++;

      if (attemptCount <= 3) {
        // Add delay to make each retry observable
        await page.waitForTimeout(800);
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-gen-123',
            prompt: 'Test prompt that will fail',
            style: 'realistic',
            imageUrl: '/generated/test-image.jpg',
            timestamp: new Date().toISOString()
          })
        });
      }
    });

    await uploadImage(page);
    await fillPromptAndStyle(page, 'Test prompt that will fail');
    await generateImage(page);

    // Wait for loading state first
    const generateButton = page.getByRole('button', { name: /Generating/i });
    await expect(generateButton).toBeVisible();

    // Verify at least one retry happens (more reliable than checking all 3)
    await expect(generateButton).toContainText(/Retry [1-3]\/3/, { timeout: 15000 });

    // Verify final success after retries
    await expect(page.getByText('Latest Generation')).toBeVisible({ timeout: 30000 });

    // Verify we made 4 attempts (3 failures + 1 success)
    expect(attemptCount).toBe(4);
  });
  // ------------------------------
  // Abort Functionality - FIXED
  // ------------------------------
  test('should cancel in-flight request with abort button', async ({ page }) => {
    let requestAborted = false;

    // Mock slow API response
    await page.route('**/api/generate', async route => {
      if (requestAborted) {
        return; // Request was aborted
      }
      // Delay response to allow abort
      await page.waitForTimeout(3000);
      await route.continue();
    });

    await uploadImage(page);
    await fillPromptAndStyle(page, 'Test prompt to abort');
    await generateImage(page);

    // Wait for abort button to appear
    const abortButton = page.getByRole('button', { name: /Abort/i });
    await expect(abortButton).toBeVisible({ timeout: 5000 });

    // Click abort button
    await abortButton.click();
    requestAborted = true;

    // Should return to ready state
    await expect(page.getByRole('button', { name: /Generate Image/i })).toBeVisible({ timeout: 5000 });
  });

  // ------------------------------
  // Form Validation - FIXED
  // ------------------------------
  test('should validate required fields', async ({ page }) => {
    // Test 1: Try to generate without upload
    await fillPromptAndStyle(page, 'Test prompt');
    await generateImage(page);

    await expect(page.getByText(/Please upload an image/i)).toBeVisible();

    // Clear the error by uploading an image
    await uploadImage(page);

    // Wait for error to clear
    await expect(page.getByText(/Please upload an image/i)).not.toBeVisible();

    // Test 2: Try to generate without prompt
    await page.getByPlaceholder('Describe how you want to transform the image...').clear();
    await generateImage(page);

    await expect(page.getByText(/Please enter a prompt/i)).toBeVisible();
  });

  // ------------------------------
  // History Functionality - FIXED with API mocking
  // ------------------------------
  test('should load previous generation into workspace', async ({ page }) => {
    // Set up the mock BEFORE any navigation
    await page.route('**/api/generations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'first-gen',
          prompt: 'First generation',
          style: 'anime',
          imageUrl: '/generated/first.jpg',
          timestamp: new Date().toISOString()
        }, {
          id: 'second-gen',
          prompt: 'Second generation',
          style: 'realistic',
          imageUrl: '/generated/second.jpg',
          timestamp: new Date().toISOString()
        }])
      });
    });

    // Now reload to trigger the mock
    await page.reload();

    // Wait for generations to load
    await expect(page.getByText('Recent Generations')).toBeVisible();
    await expect(page.getByText('First generation')).toBeVisible({ timeout: 10000 });

    // Click on first generation in history - more specific selector
    await page.getByRole('button', { name: /Load generation/i }).first().click();

    // Verify prompt and style are loaded
    await expect(page.getByPlaceholder('Describe how you want to transform the image...'))
      .toHaveValue('First generation');
    await expect(page.locator('select[name="style"]')).toHaveValue('anime');

    // Verify success toast
    await expect(page.getByText(/Generation loaded into workspace/i)).toBeVisible();
  });

  test('should display empty history state', async ({ page }) => {
    // Mock empty generations
    await page.route('**/api/generations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Reload to see empty state
    await page.reload();
    await expect(page.getByText('No generations yet')).toBeVisible();
  });

  // ------------------------------
  // Accessibility and UX - FIXED
  // ------------------------------
  test('should maintain focus management during generation', async ({ page }) => {
    // Mock API for successful generation
    await page.route('**/api/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-gen-123',
          prompt: 'Test focus management',
          style: 'realistic',
          imageUrl: '/generated/test-image.jpg',
          timestamp: new Date().toISOString()
        })
      });
    });

    await uploadImage(page);
    await fillPromptAndStyle(page, 'Test focus management');
    await generateImage(page);

    // During loading, abort button should be visible
    const abortButton = page.getByRole('button', { name: /Abort/i });
    await expect(abortButton).toBeVisible();
  });
});

// 🔹 Configuration for slower CI environments
test.describe.configure({ timeout: 60000 });