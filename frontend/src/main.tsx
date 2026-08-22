import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { Login } from './pages/Login'
import { OAuth2RedirectHandler } from './pages/OAuth2RedirectHandler'
import { ProductStats } from './pages/ProductStats'
import { PrimeReactProvider } from 'primereact/api'

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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
          <Route path="/stats" element={<ProductStats />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </PrimeReactProvider>
  </React.StrictMode>,
)
