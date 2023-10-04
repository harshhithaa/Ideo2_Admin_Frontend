import { Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import MainLayout from './components/MainLayout';
import Account from './pages/Account';
import CustomerList from './pages/CustomerList';
import MonitorList from './pages/MonitorList';
import PlaylistList from './pages/PlaylistList';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProductList from './pages/ProductList';
import Register from './pages/Register';
import CreatePlaylist from './pages/CreatePlaylist';
import Settings from './pages/Settings';
import ScheduleList from './pages/ScheduleList';
import SaveMedia from './pages/SaveMedia';
import MediaList from './pages/MediaList';
import SaveSchedule from './pages/SaveSchedule';
import SaveMonitor from './pages/SaveMonitor';
import CustomizedMedia from './pages/CustomizedMedia';
import EditImage from './pages/EditImage';
import SplitMedia from './pages/SplitMedia';
import Analytics from './pages/Analytics';

const routes = [
  {
    path: 'app',
    element: <DashboardLayout />,
    children: [
      { path: 'account', element: <Account /> },
      { path: 'customers', element: <CustomerList /> },
      { path: 'monitors', element: <MonitorList /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'products', element: <ProductList /> },
      { path: 'playlists', element: <PlaylistList /> },
      { path: 'schedules', element: <ScheduleList /> },
      { path: 'settings', element: <Settings /> },
      { path: 'savemedia', element: <SaveMedia /> },
      { path: 'createmedia', element: <CustomizedMedia /> },
      { path: 'splitmedia', element: <SplitMedia /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'media', element: <MediaList /> },
      { path: 'editimage', element: <EditImage /> },
      { path: 'saveschedule', element: <SaveSchedule /> },
      { path: 'savemonitor', element: <SaveMonitor /> },
      { path: 'createplaylist', element: <CreatePlaylist /> },
      { path: '*', element: <Navigate to="/404" /> }
    ]
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: '404', element: <NotFound /> },
      { path: '/', element: <Navigate to="login" /> },
      { path: '*', element: <Navigate to="/404" /> }
    ]
  }
];

export default routes;
