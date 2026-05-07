import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)', color: 'var(--text2)',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          padding: '2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: 'var(--text1)', marginBottom: '0.5rem' }}>Coś poszło nie tak / Something went wrong</h2>
          <p style={{ maxWidth: 400, lineHeight: 1.6 }}>Wystąpił nieoczekiwany błąd. Odśwież stronę, aby spróbować ponownie.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: '1.5rem', padding: '0.5rem 1.5rem', cursor: 'pointer' }}
            className="calc-btn"
          >
            Odśwież stronę
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
