import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard } from './clipboard';

class FakeTextarea {
  value = '';
  style: Record<string, string> = {};
  select = vi.fn();
}

function stubDocument(execCommand = vi.fn().mockReturnValue(true)) {
  const appendChild = vi.fn();
  const removeChild = vi.fn();
  const createElement = vi.fn(() => new FakeTextarea());
  vi.stubGlobal('document', {
    createElement,
    execCommand,
    body: { appendChild, removeChild },
  });
  return { execCommand, createElement };
}

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls onDone via navigator.clipboard.writeText when it succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const onDone = vi.fn();

    copyToClipboard('hello', onDone);
    await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when navigator.clipboard.writeText rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { execCommand } = stubDocument();
    const onDone = vi.fn();

    copyToClipboard('hello', onDone);
    await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('regression: falls back to execCommand synchronously instead of throwing when navigator.clipboard itself is undefined (non-HTTPS context, older browsers) — accessing .writeText on it directly threw a TypeError that bypassed the .catch() fallback entirely', () => {
    vi.stubGlobal('navigator', {});
    const { execCommand } = stubDocument();
    const onDone = vi.fn();

    expect(() => copyToClipboard('hello', onDone)).not.toThrow();
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
