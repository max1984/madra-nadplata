import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ErrorInfo } from 'react';
import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary.componentDidCatch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('regression: logs the caught error and component stack to console.error instead of swallowing it silently — getDerivedStateFromError alone only flips render state, so without this the only trace of a crash was a blank fallback screen with nothing to diagnose', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const boundary = new ErrorBoundary({ children: null });
    const error = new Error('boom');
    const errorInfo: ErrorInfo = { componentStack: 'at Calculator\nat App' };

    boundary.componentDidCatch(error, errorInfo);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('ErrorBoundary caught an error', error, errorInfo);
  });

  it('getDerivedStateFromError flips render state to show the fallback UI', () => {
    expect(ErrorBoundary.getDerivedStateFromError()).toEqual({ hasError: true });
  });
});
