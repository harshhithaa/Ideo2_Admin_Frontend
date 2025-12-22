/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Box, Drawer, Hidden, List } from '@mui/material';
import {
  BarChart as BarChartIcon,
  Calendar as CalendarIcon,
  Monitor as MonitorIcon,
  PlayCircle as PlayCircleIcon,
  Film as FilmIcon,
  PieChart as PieChartIcon
} from 'react-feather';
import NavItem from './NavItem';

const items = [
  {
    href: '/app/dashboard',
    icon: BarChartIcon,
    title: 'Dashboard'
  },
  {
    href: '/app/media',
    icon: FilmIcon,
    title: 'Media'
  },
  {
    href: '/app/playlists',
    icon: PlayCircleIcon,
    title: 'Playlist'
  },
  {
    href: '/app/schedules',
    icon: CalendarIcon,
    title: 'Schedule'
  },
  {
    href: '/app/monitors',
    icon: MonitorIcon,
    title: 'Monitors'
  }
  // {
  //   href: '/app/analytics',
  //   icon: PieChartIcon,
  //   title: 'Analytics'
  // }
];

const DashboardSidebar = ({ onMobileClose, openMobile }) => {
  const location = useLocation();

  useEffect(() => {
    if (openMobile && onMobileClose) {
      onMobileClose();
    }
  }, [location.pathname]);

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <Box sx={{ p: 2 }}>
        <List
          sx={{
            // style active/selected list items to match app theme
            '& .Mui-selected': {
              backgroundColor: 'rgba(99,102,241,0.12)', // light blue accent
              color: 'primary.main',
              borderRadius: 1
            },
            '& .MuiListItemButton-root': {
              borderRadius: 1
            }
          }}
        >
          {items.map((item) => {
            const selected =
              location.pathname === item.href ||
              location.pathname.startsWith(item.href + '/');

            return (
              <NavItem
                href={item.href}
                key={item.title}
                title={item.title}
                icon={item.icon}
                selected={selected}
              />
            );
          })}
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      <Hidden lgUp>
        <Drawer
          anchor="left"
          onClose={onMobileClose}
          open={openMobile}
          variant="temporary"
          PaperProps={{
            sx: {
              width: 256
            }
          }}
        >
          {content}
        </Drawer>
      </Hidden>
      <Hidden lgDown>
        <Drawer
          anchor="left"
          open
          variant="persistent"
          PaperProps={{
            sx: {
              width: 256,
              top: 64,
              height: 'calc(100% - 64px)'
            }
          }}
        >
          {content}
        </Drawer>
      </Hidden>
    </>
  );
};

DashboardSidebar.propTypes = {
  onMobileClose: PropTypes.func,
  openMobile: PropTypes.bool
};

DashboardSidebar.defaultProps = {
  onMobileClose: () => {},
  openMobile: false
};

export default DashboardSidebar;
