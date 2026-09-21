// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider } from '../contexts/LangContext';
import AdConsent from './AdConsent';

const STORAGE_KEY = 'ad_consent_v1';

afterEach(() => {
  cleanup();
  localStorage.removeItem(STORAGE_KEY);
  // @ts-expect-error test-only cleanup of a global the component reads defensively
  delete window.gtag;
});

function renderAdConsent() {
  return render(
    <LangProvider>
      <AdConsent />
    </LangProvider>
  );
}

describe('AdConsent (render)', () => {
  it('shows the banner when no consent decision has been stored yet', () => {
    renderAdConsent();
    expect(screen.getByText(/AdSense/i)).toBeInTheDocument();
  });

  it('does not re-show the banner once a decision (granted or denied) is already stored', () => {
    localStorage.setItem(STORAGE_KEY, 'granted');
    const { container } = renderAdConsent();
    expect(container.querySelector('.consent-banner')).toBeNull();

    localStorage.setItem(STORAGE_KEY, 'denied');
    const { container: container2 } = renderAdConsent();
    expect(container2.querySelector('.consent-banner')).toBeNull();
  });

  it('regression: accepting stores "granted", calls gtag consent update with granted values, and hides the banner', async () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const user = userEvent.setup();
    const { container } = renderAdConsent();

    const acceptBtn = container.querySelector<HTMLButtonElement>('.consent-btn-accept')!;
    await user.click(acceptBtn);

    expect(localStorage.getItem(STORAGE_KEY)).toBe('granted');
    expect(gtag).toHaveBeenCalledWith('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
    expect(container.querySelector('.consent-banner')).toBeNull();
  });

  it('regression: declining stores "denied", calls gtag consent update with denied values, and hides the banner', async () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const user = userEvent.setup();
    const { container } = renderAdConsent();

    const declineBtn = container.querySelector<HTMLButtonElement>('.consent-btn:not(.consent-btn-accept)')!;
    await user.click(declineBtn);

    expect(localStorage.getItem(STORAGE_KEY)).toBe('denied');
    expect(gtag).toHaveBeenCalledWith('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    expect(container.querySelector('.consent-banner')).toBeNull();
  });

  it('regression: a previously stored decision is re-applied to gtag on mount (within the wait_for_update window), not just at decision time', () => {
    localStorage.setItem(STORAGE_KEY, 'granted');
    const gtag = vi.fn();
    window.gtag = gtag;
    renderAdConsent();

    expect(gtag).toHaveBeenCalledWith('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });
});
