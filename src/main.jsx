import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import './styles/global.css';
import { ToastProvider } from './components/ui/Toast';
import { IconContext } from '@phosphor-icons/react';
import { RealtimeBridge } from './services/RealtimeBridge';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <LanguageProvider>
        <IconContext.Provider value={{ weight: 'bold', size: 20 }}><AuthProvider><ToastProvider><RealtimeBridge /><App /></ToastProvider></AuthProvider></IconContext.Provider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
