import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Bundles from './pages/Bundles';
import OrderView from './pages/OrderView';
import DeliveryForm from './pages/DeliveryForm';
import DmSimulator from './pages/DmSimulator';

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>라이브 주문 관리</h2>
        <nav>
          <NavLink to="/" end>대시보드</NavLink>
          <NavLink to="/sessions">라이브 세션</NavLink>
          <NavLink to="/orders">주문 관리</NavLink>
          <NavLink to="/customers">고객 관리</NavLink>
          <NavLink to="/bundles">배송 관리</NavLink>
          <NavLink to="/dm-sim">DM 시뮬레이터</NavLink>
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/bundles" element={<Bundles />} />
          <Route path="/order/:token" element={<OrderView />} />
          <Route path="/delivery/:token" element={<DeliveryForm />} />
          <Route path="/dm-sim" element={<DmSimulator />} />
        </Routes>
      </main>
    </div>
  );
}
