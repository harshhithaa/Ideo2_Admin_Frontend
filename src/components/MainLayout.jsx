import { Outlet } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import MainNavbar from './MainNavbar';

const MainLayoutRoot = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  height: '100vh',   // fixed to viewport
  width: '100%',
  overflow: 'hidden'
}));

const MainLayoutWrapper = styled('div')({
  display: 'flex',
  flex: '1 1 auto',
  overflow: 'hidden',
  paddingTop: 64
});

const MainLayoutContainer = styled('div')({
  display: 'flex',
  flex: '1 1 auto',
  overflow: 'hidden'
});

const MainLayoutContent = styled('div')({
  flex: '1 1 auto',
  height: '100%',
  overflowY: 'auto',   // enable vertical scrolling on the main content container
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch'
});

const MainLayout = () => (
  <MainLayoutRoot>
    <MainNavbar />
    <MainLayoutWrapper>
      <MainLayoutContainer>
        <MainLayoutContent>
          <Outlet />
        </MainLayoutContent>
      </MainLayoutContainer>
    </MainLayoutWrapper>
  </MainLayoutRoot>
);

export { MainLayoutRoot, MainLayoutWrapper, MainLayoutContainer, MainLayoutContent };
export default MainLayout;
