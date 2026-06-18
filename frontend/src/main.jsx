import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

document.body.style.cssText = 'margin:0;background:#faf8f4;'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
