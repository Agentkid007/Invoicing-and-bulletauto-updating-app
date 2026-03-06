import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import SplashAnimation from '../../shared/components/SplashAnimation.jsx';
import './App.css';

function Root() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return (
      <SplashAnimation
        logo="/kiddy-logo.png"
        appName="KIDDY"
        duration={3500}
        onComplete={() => setSplashDone(true)}
      />
    );
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
