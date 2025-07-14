import { createRoot } from 'react-dom/client'
import './index.css'
import './assets/admin/content/styles/style.css'
import './assets/user/styles/style.css'
import App from './App.jsx'

import { Provider } from 'react-redux'
import { appStore } from './app/store'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  <>
    <Provider store={appStore}>
      <App />
      <Toaster />
    </Provider>
  </>

)
