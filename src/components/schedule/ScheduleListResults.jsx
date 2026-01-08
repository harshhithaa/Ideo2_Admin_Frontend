/* eslint-disable react/prop-types */
/* eslint-disable linebreak-style */
import React, { useState } from 'react';
import {
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    Checkbox,
    IconButton,
    Typography
} from '@mui/material';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';

const pad2 = (n) => `${n < 10 ? '0' : ''}${n}`;

const extractCreationValue = (schedule) => {
    // Try common candidate properties returned by various APIs
    return (
        schedule?.CreationDate ||
        schedule?.creationDate ||
        schedule?.createdAt ||
        schedule?.CreatedAt ||
        schedule?.Creation ||
        schedule?.creation ||
        schedule?.CreatedOn ||
        schedule?.createdOn ||
        schedule?.Created ||
        schedule?.created ||
        null
    );
};

const formatCreation = (value) => {
    // Accepts ISO string, Date, timestamp (ms or s) or null
    if (!value) return { date: '-', time: '-' };

    let d;
    if (typeof value === 'number') {
        // If seconds (10 digits), convert to ms
        const asMs = value < 1e12 ? value * 1000 : value;
        d = new Date(asMs);
    } else if (typeof value === 'string') {
        // Some APIs return '/Date(...)' or similar - try to parse safely
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

const getAssignedPlaylist = (schedule) => {
    // Return playlist name from various possible shapes returned by backend
    if (!schedule) return '-';

    // Direct name fields
    if (schedule.AssignedPlaylist && typeof schedule.AssignedPlaylist === 'string') return schedule.AssignedPlaylist;
    if (schedule.assignedPlaylist && typeof schedule.assignedPlaylist === 'string') return schedule.assignedPlaylist;
    if (schedule.PlaylistName && typeof schedule.PlaylistName === 'string') return schedule.PlaylistName;
    if (schedule.playlistName && typeof schedule.playlistName === 'string') return schedule.playlistName;
    if (schedule.Name && typeof schedule.Name === 'string') return schedule.Name;

    // Nested playlist object: { Playlist: { Name: '...' } } or { Playlist: '...' }
    if (schedule.Playlist) {
        if (typeof schedule.Playlist === 'string') return schedule.Playlist;
        if (typeof schedule.Playlist === 'object') {
            if (schedule.Playlist.Name) return schedule.Playlist.Name;
            if (schedule.Playlist.name) return schedule.Playlist.name;
        }
    }

    // Some models store a reference id only (PlaylistRef) - we can't resolve name here
    // Fallback to '-' when no name is available
    return '-';
};

const ScheduleListResults = ({ Schedules = [], setselected, search = '', view, editcall, ...rest }) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(0);

    const handleSelectAll = (event) => {
        let newSelected = [];
        if (event.target.checked) {
            newSelected = Schedules.map((s) => s.Id || s.id || s.ScheduleId);
        }
        setSelectedIds(newSelected);
        setselected(newSelected);
    };

    const handleSelectOne = (event, id) => {
        const selectedIndex = selectedIds.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedIds, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedIds.slice(1));
        } else if (selectedIndex === selectedIds.length - 1) {
            newSelected = newSelected.concat(selectedIds.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedIds.slice(0, selectedIndex),
                selectedIds.slice(selectedIndex + 1)
            );
        }

        setSelectedIds(newSelected);
        setselected(newSelected);
    };

    const handleLimitChange = (event) => {
        setLimit(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    // simple search filter (keeps compatibility with existing behavior)
    const filtered = Schedules.filter((s) => {
        if (!search) return true;
        const text = `${s.Title || s.title || ''} ${s.Description || s.description || ''}`.toLowerCase();
        return text.includes(search.toLowerCase());
    });

    return (
        <Card {...rest} sx={{ boxShadow: 2 }}>
            {/* keep table responsive: no horizontal scroll, internal vertical scroll only */}
            <Box sx={{ width: '100%', maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden' }}>
                <Table stickyHeader sx={{ tableLayout: 'fixed', width: '100%', '& th, & td': { fontSize: '0.95rem' } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" sx={{ width: '8%' }} align="left">
                                <Checkbox
                                    color="primary"
                                    checked={selectedIds.length === Schedules.length && Schedules.length > 0}
                                    indeterminate={selectedIds.length > 0 && selectedIds.length < Schedules.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, width: '15%', fontSize: '0.95rem' }}>SCHEDULE TITLE</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: '15%', fontSize: '0.95rem' }}>DESCRIPTION</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: '20%', fontSize: '0.95rem' }}>ASSIGNED PLAYLIST</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: '14%', fontSize: '0.95rem' }}>CREATION DATE</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: '16%', fontSize: '0.95rem' }}>CREATION TIME</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: '6%', textAlign: 'center', fontSize: '0.95rem' }}>EDIT</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(() => {
                            if (!filtered.length) {
                                return (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                            No matches found
                                        </TableCell>
                                    </TableRow>
                                );
                            }

                            return filtered.slice(page * limit, page * limit + limit).map((schedule) => {
                                const id = schedule.Id || schedule.id || schedule.ScheduleId;
                                const rawCreation = extractCreationValue(schedule);
                                const creation = formatCreation(rawCreation);
                                const playlistName = getAssignedPlaylist(schedule);

                                return (
                                    <TableRow hover key={id} selected={selectedIds.indexOf(id) !== -1}>
                                        <TableCell padding="checkbox" sx={{ width: '8%' }}>
                                            <Checkbox
                                                color="primary"
                                                checked={selectedIds.indexOf(id) !== -1}
                                                onChange={(event) => handleSelectOne(event, id)}
                                                value={selectedIds.indexOf(id) !== -1}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ pl: 2, width: '20%' }}>
                                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                                                {schedule.Title || schedule.title || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ width: '22%' }}>
                                            <Typography variant="body2" color="textSecondary" noWrap sx={{ fontSize: '0.95rem' }}>
                                                {schedule.Description || schedule.description || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ width: '20%' }}>
                                            <Typography variant="body2" color="textSecondary" noWrap sx={{ fontSize: '0.95rem' }}>
                                                {playlistName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ width: '14%' }}>
                                            <Typography variant="body2" noWrap sx={{ fontSize: '0.95rem' }}>
                                                {creation.date}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ width: '10%' }}>
                                            <Typography variant="body2" noWrap sx={{ fontSize: '0.95rem' }}>
                                                {creation.time}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: '6%' }}>
                                            <IconButton
                                                color="primary"
                                                onClick={() => editcall && editcall(schedule)}
                                                size="large"
                                            >
                                                <EditTwoToneIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            });
                        })()}
                    </TableBody>
                </Table>
            </Box>
            <TablePagination
                component="div"
                count={filtered.length}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleLimitChange}
                page={page}
                rowsPerPage={limit}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{ '& .MuiTablePagination-toolbar': { px: 2 } }}
            />
        </Card>
    );
};

export default ScheduleListResults;
