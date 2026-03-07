import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import SplashAnimation from '../../shared/components/SplashAnimation.jsx';
import './App.css';

/**
 * SplashErrorBoundary — catches any render error inside SplashAnimation and
 * immediately skips to the main app rather than showing a blank screen.
 */
class SplashErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    // Skip splash on failure
    this.props.onSkip?.();
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function Root() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return (
      <SplashErrorBoundary onSkip={() => setSplashDone(true)}>
        <SplashAnimation
          logo="/kiddy-logo.png"
          appName="KIDDY"
          duration={3500}
          onComplete={() => setSplashDone(true)}
        />
      </SplashErrorBoundary>
    );
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
