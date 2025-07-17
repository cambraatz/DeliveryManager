//import logo from './logo.svg';
import './App.css';
import DeliveryForm from './components/DeliveryForm';
import DeliveryValidation from './components/DeliveryValidation';
import DeliveryManifest from './components/DeliveryManifest';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppProvider } from './contexts/AppContext';

function App() {
  return (
    <div className="App">
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DeliveryValidation />} />
            <Route path='/deliveries' element={<DeliveryManifest />} />
            <Route path='/deliveries/:mfstkey' element={<DeliveryForm />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </div>
  );
}

export default App;