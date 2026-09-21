// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider } from '../contexts/LangContext';
import PrivacyPolicy from './PrivacyPolicy';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

function renderPrivacyPolicy() {
  return render(
    <LangProvider>
      <PrivacyPolicy />
    </LangProvider>
  );
}

describe('PrivacyPolicy modal (render)', () => {
  it('is hidden when the URL has no #privacy hash', () => {
    renderPrivacyPolicy();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is visible on mount when the URL already has #privacy (deep link/refresh)', () => {
    window.location.hash = '#privacy';
    renderPrivacyPolicy();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens when #privacy is navigated to after mount (hashchange)', async () => {
    renderPrivacyPolicy();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    window.location.hash = '#privacy';
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it(
    'regression: clicking "Zamknij" actually closes the modal — history.pushState() (used to clear the ' +
      'hash) does not fire a hashchange event, so closeModal must call setVisible(false) directly instead ' +
      'of relying on the hashchange listener alone (this exact bug shipped once, per docs/PROGRESS.md)',
    async () => {
      window.location.hash = '#privacy';
      const user = userEvent.setup();
      renderPrivacyPolicy();
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /zamknij|close/i }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }
  );

  it('closes when clicking the backdrop (outside the dialog)', async () => {
    window.location.hash = '#privacy';
    const user = userEvent.setup();
    const { container } = renderPrivacyPolicy();
    const backdrop = container.firstElementChild as HTMLElement;

    await user.click(backdrop);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    window.location.hash = '#privacy';
    const user = userEvent.setup();
    renderPrivacyPolicy();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves focus into the dialog on open and restores it to the previously focused element on close', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <LangProvider>
        <button type="button">outside trigger</button>
        <PrivacyPolicy />
      </LangProvider>
    );
    const trigger = screen.getByRole('button', { name: /outside trigger/i });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    window.location.hash = '#privacy';
    const dialog = await screen.findByRole('dialog');
    expect(document.activeElement).toBe(dialog);

    await user.click(screen.getByRole('button', { name: /zamknij|close/i }));
    rerender(
      <LangProvider>
        <button type="button">outside trigger</button>
        <PrivacyPolicy />
      </LangProvider>
    );
    expect(document.activeElement).toBe(trigger);
  });
});
