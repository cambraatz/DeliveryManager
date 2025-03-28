//import logo from './logo.svg';
import './App.css';
import DriverPortal from './Components/DriverPortal'
import DeliveryForm from './Components/DeliveryForm'
import DriverLogin from './Components/DriverLogin'
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DriverLogin />} />
          <Route path='/deliveries' element={<DriverPortal />} />
          <Route path='/deliveries/:mfstkey' element={<DeliveryForm />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;