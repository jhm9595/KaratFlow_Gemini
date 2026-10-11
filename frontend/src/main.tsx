import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { Login } from './pages/Login'
import { OAuth2RedirectHandler } from './pages/OAuth2RedirectHandler'
import { ProductStats } from './pages/ProductStats'
import { ProductAdmin } from './pages/ProductAdmin'
import { PrimeReactProvider } from 'primereact/api'
import { ModalProvider } from './context/ModalContext'

// Core styles
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider>
      <BrowserRouter>
        <ModalProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
            <Route path="/stats" element={<ProductStats />} />
            <Route path="/products" element={<ProductAdmin />} />
            <Route path="/*" element={<App />} />
          </Routes>
        </ModalProvider>
      </BrowserRouter>
    </PrimeReactProvider>
  </React.StrictMode>,
)
