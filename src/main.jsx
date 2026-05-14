import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { GlobalModalProvider } from "./components/GlobalModal.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <GlobalModalProvider>
      <App />
    </GlobalModalProvider>
  </BrowserRouter>
)
