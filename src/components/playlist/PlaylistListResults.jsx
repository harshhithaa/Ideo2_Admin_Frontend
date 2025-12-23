/* eslint-disable react/prop-types */
/* eslint-disable linebreak-style */
import { useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Airplay as AirplayIcon, Edit as EditIcon } from 'react-feather';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  SvgIcon
} from '@mui/material';
import PropTypes from 'prop-types';
import PreviewModal from './PlaylistPreview';

const pad2 = (n) => `${n < 10 ? '0' : ''}${n}`;

const extractCreationValue = (item) => {
  return (
    item?.CreatedOn ||
    item?.createdOn ||
    item?.CreatedAt ||
    item?.createdAt ||
    item?.Created ||
    item?.created ||
    item?.CreatedOnUtc ||
    null
  );
};

const formatCreation = (value) => {
  if (!value) return { date: '-', time: '-' };

  let d;
  if (typeof value === 'number') {
    const asMs = value < 1e12 ? value * 1000 : value;
    d = new Date(asMs);
  } else if (typeof value === 'string') {
    const msMatch = value.match(/\/Date\((\d+)(?:[+-]\d+)?\)\//);
    if (msMatch) {
      d = new Date(parseInt(msMatch[1], 10));
    } else {
      d = new Date(value);
    }
  } else if (value instanceof Date) {
    d = value;
  } else {
    d = new Date(value);
  }

  if (Number.isNaN(d.getTime())) return { date: '-', time: '-' };

  const date = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return { date, time };
};

const PlaylistListResults = (props) => {
  const { playlists, search } = props || {};
  const [selectedPlaylistRefs, setSelectedPlaylistRefs] = useState([]);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0);
  const [showPreviewModal, setshowPreviewModal] = useState(false);
  const [allchecked, setall] = useState(false);
  const [Media, setMedia] = useState([]);
  const [previewTitle, setPreviewTitle] = useState('');

  const handleSelectAll = (event) => {
    let newSelectedPlaylistRefs;
    setall(event.target.checked);
    if (event.target.checked) {
      newSelectedPlaylistRefs = playlists.map(
        (Playlist) => Playlist.PlaylistRef
      );
    } else {
      newSelectedPlaylistRefs = [];
    }
    props.setselected(newSelectedPlaylistRefs);
    setSelectedPlaylistRefs(newSelectedPlaylistRefs);
  };

  const handleSelectOne = (event, PlaylistRef) => {
    const selectedIndex = selectedPlaylistRefs.indexOf(PlaylistRef);
    let newSelectedPlaylistRefs = [];

    if (selectedIndex === -1) {
      newSelectedPlaylistRefs = newSelectedPlaylistRefs.concat(
        selectedPlaylistRefs,
        PlaylistRef
      );
    } else if (selectedIndex === 0) {
      newSelectedPlaylistRefs = newSelectedPlaylistRefs.concat(
        selectedPlaylistRefs.slice(1)
      );
    } else if (selectedIndex === selectedPlaylistRefs.length - 1) {
      newSelectedPlaylistRefs = newSelectedPlaylistRefs.concat(
        selectedPlaylistRefs.slice(0, -1)
      );
    } else if (selectedIndex > 0) {
      newSelectedPlaylistRefs = newSelectedPlaylistRefs.concat(
        selectedPlaylistRefs.slice(0, selectedIndex),
        selectedPlaylistRefs.slice(selectedIndex + 1)
      );
    }
    props.setselected(newSelectedPlaylistRefs);
    setSelectedPlaylistRefs(newSelectedPlaylistRefs);
  };

  const handleLimitChange = (event) => {
    setLimit(event.target.value);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handlePlaylistPreview = () => {
    setshowPreviewModal(!showPreviewModal);
  };

  return (
    <Card sx={{ boxShadow: 2 }}>
      {/* constrain inner area so page stays static; inner area scrolls */}
      <PerfectScrollbar style={{ maxHeight: '60vh' }}>
        <Box sx={{ width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
          {showPreviewModal && <PreviewModal Media={Media} title={previewTitle} />}

          {/* Table: ensure proper opening and closing tags */}
          <Table sx={{ tableLayout: 'fixed', '& th, & td': { fontSize: '0.95rem' } }}>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: '#f5f5f5',
                  borderBottom: '2px solid #ddd'
                }}
              >
                <TableCell
                  padding="checkbox"
                  align="center"
                  sx={{
                    fontWeight: 700,
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    width: '5%'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Checkbox
                      checked={allchecked}
                      color="primary"
                      indeterminate={
                        selectedPlaylistRefs.length > 0
                        && selectedPlaylistRefs.length < playlists
                        && playlists.length
                      }
                      onChange={handleSelectAll}
                    />
                  </Box>
                </TableCell>

                <TableCell
                  align="left"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '16px',
                    width: '20%'
                  }}
                >
                  Playlist Name
                </TableCell>

                <TableCell
                  align="left"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '16px',
                    width: '18%'
                  }}
                >
                  Description
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '16px',
                    width: '10%'
                  }}
                >
                  Preview
                </TableCell>
                
                {/* Replaced single Creation Date column with two columns: CREATION DATE and TIME */}
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '16px',
                    width: '14%'
                  }}
                >
                  Creation Date
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '16px',
                    width: '12%'
                  }}
                >
                  CREATION TIME
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '16px',
                    width: '10%'
                  }}
                >
                  Edit
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {(() => {
                const filtered = playlists ? playlists.filter((item) =>
                  item.Name?.toLowerCase().includes((search || '').toLowerCase())
                ) : [];

                if (!filtered.length) {
                  return (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No matches found
                      </TableCell>
                    </TableRow>
                  );
                }

                return filtered
                  .slice(page * limit, page * limit + limit)
                  .map((Playlist) => {
                    const rawCreation = extractCreationValue(Playlist);
                    const creation = formatCreation(rawCreation);

                    return (
                      <TableRow
                        hover
                        key={Playlist.PlaylistRef}
                        selected={
                          selectedPlaylistRefs.indexOf(Playlist.PlaylistRef) !== -1
                        }
                        sx={{
                          '&:hover': { backgroundColor: '#f9f9f9' },
                          borderBottom: '1px solid #eee',
                          height: 64
                        }}
                      >
                        <TableCell
                          padding="checkbox"
                          align="center"
                          sx={{ padding: '12px 16px', width: '5%' }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Checkbox
                              checked={
                                selectedPlaylistRefs.indexOf(Playlist.PlaylistRef)
                                !== -1
                              }
                              onChange={(event) => handleSelectOne(event, Playlist.PlaylistRef)}
                              value="true"
                            />
                          </Box>
                        </TableCell>

                        <TableCell
                          align="left"
                          onClick={() => props.view(Playlist)}
                          sx={{
                            padding: '16px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            color: '#1976d2',
                            width: '20%',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          <Typography color="textPrimary" variant="body2" noWrap sx={{ fontSize: '0.95rem' }}>
                            {Playlist.Name}
                          </Typography>
                        </TableCell>

                        <TableCell
                          align="left"
                          onClick={() => props.view(Playlist)}
                          sx={{
                            padding: '16px',
                            cursor: 'pointer',
                            color: '#666',
                            fontSize: '0.9rem',
                            width: '18%',
                            '&:hover': {
                              backgroundColor: '#fafafa'
                            }
                          }}
                        >
                          <Typography noWrap sx={{ fontSize: '0.95rem', color: '#666' }}>
                            {Playlist.Description === 'null' ? '--' : Playlist.Description}
                          </Typography>
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{ padding: '16px', width: '10%' }}
                        >
                          <Button
                            sx={{
                              minWidth: 40,
                              padding: '8px',
                              display: 'flex',
                              justifyContent: 'center',
                              margin: '0 auto',
                              '&:hover': {
                                backgroundColor: '#e3f2fd'
                              }
                            }}
                            onClick={() => {
                              setMedia(Playlist.Media);
                              setPreviewTitle(Playlist.Name || '');
                              handlePlaylistPreview();
                            }}
                          >
                            <SvgIcon fontSize="small" color="primary">
                              <AirplayIcon />
                            </SvgIcon>
                          </Button>
                        </TableCell>

                        {/* CREATION DATE - centered, formatted DD/MM/YYYY */}
                        <TableCell
                          align="center"
                          sx={{
                            padding: '16px',
                            color: '#999',
                            fontSize: '0.9rem',
                            width: '14%'
                          }}
                        >
                          {creation.date}
                        </TableCell>

                        {/* TIME - centered, formatted HH:mm */}
                        <TableCell
                          align="center"
                          sx={{
                            padding: '16px',
                            color: '#999',
                            fontSize: '0.9rem',
                            width: '12%'
                          }}
                        >
                          {creation.time}
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{ padding: '16px', width: '10%' }}
                        >
                          <Button
                            sx={{
                              minWidth: 40,
                              padding: '8px',
                              display: 'flex',
                              justifyContent: 'center',
                              margin: '0 auto',
                              '&:hover': {
                                backgroundColor: '#e3f2fd'
                              }
                            }}
                            onClick={() => props.editcall(Playlist)}
                          >
                            <SvgIcon fontSize="small" color="primary">
                              <EditIcon />
                            </SvgIcon>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  });
              })()}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>

      {/* Pagination remains outside the scroller so it's always visible */}
      <TablePagination
        component="div"
        count={playlists ? playlists.length : 0}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleLimitChange}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{ borderTop: '2px solid #eee', backgroundColor: '#f9f9f9' }}
      />
    </Card>
  );
};

PlaylistListResults.propTypes = {
  playlists: PropTypes.array
};

export default PlaylistListResults;
