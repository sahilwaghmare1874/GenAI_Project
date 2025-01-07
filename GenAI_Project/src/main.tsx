import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "./components/theme-provider"

ReactDOM.createRoot(document.getElementById('root')!).render(

       <ThemeProvider defaultTheme="light" storageKey="vite-ui-th eme">
       <App />
       </ThemeProvider>

)
