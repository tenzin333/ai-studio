// frontend/src/tests/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom'; // Changed!

afterEach(() => {
  cleanup();
});