// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider } from '../contexts/LangContext';
import Nav from './Nav';

// framer-motion's AnimatePresence delays unmount on exit until its (real,
// non-zero) exit animation finishes, so "closed" state is asserted via the
// always-synchronous aria-expanded on the hamburger button, not via the
// panel's presence/absence in the DOM.
afterEach(cleanup);

function renderNav() {
  return render(
    <LangProvider>
      <Nav />
    </LangProvider>
  );
}

describe('Nav mobile menu (render)', () => {
  it('toggles aria-expanded and mounts the panel on hamburger click', async () => {
    const user = userEvent.setup();
    renderNav();
    const hamburger = screen.getByRole('button', { name: /menu/i });
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('mobile-nav-links')).toBeNull();

    await user.click(hamburger);
    expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById('mobile-nav-links');
    expect(panel).not.toBeNull();
    // Panel duplicates the nav links (FAQ etc.) — must be findable inside it specifically.
    expect(within(panel!).getByRole('link', { name: /FAQ/i })).toBeInTheDocument();
  });

  it('closes (aria-expanded back to false) on a second hamburger click', async () => {
    const user = userEvent.setup();
    renderNav();
    const hamburger = screen.getByRole('button', { name: /menu/i });
    await user.click(hamburger);
    expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await user.click(hamburger);
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderNav();
    const hamburger = screen.getByRole('button', { name: /menu/i });
    await user.click(hamburger);
    expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  it('regression: the mobile panel renders as a sibling of <nav>, not a descendant — clicking it must not be treated as an outside click', async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole('button', { name: /menu/i }));
    const panel = document.getElementById('mobile-nav-links');
    expect(panel).not.toBeNull();
    expect(panel?.closest('nav')).toBeNull();

    // Clicking a link inside the panel is an "inside" click by design (it
    // navigates and calls setMenuOpen(false) itself) — clicking the panel's
    // own background (not a link) must NOT be treated as an outside click.
    await user.click(panel!);
    expect(screen.getByRole('button', { name: /menu/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes when clicking the overlay behind the panel', async () => {
    const user = userEvent.setup();
    renderNav();
    const hamburger = screen.getByRole('button', { name: /menu/i });
    await user.click(hamburger);
    expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    const overlay = document.querySelector('.nav-overlay');
    expect(overlay).not.toBeNull();
    await user.click(overlay!);
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });
});
