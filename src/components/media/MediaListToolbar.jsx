import React, { useMemo } from 'react';
import { Box, Button, TextField, InputAdornment, SvgIcon } from '@mui/material';
import { Search as SearchIcon, Trash2 as Trash2Icon } from 'react-feather';

const MediaListToolbar = ({ media = [], onClick, selectedItems = [], query = '', onQueryChange = () => {} }) => {
  useMemo(() => {}, [media]);

  return (
    <Box>
      {/* top row: search at extreme left, actions at extreme right, no extra vertical gap below */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        {/* extreme-left quick search */}
        <TextField
          size="small"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search Media"
          sx={{ width: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SvgIcon fontSize="small" color="action">
                  <SearchIcon />
                </SvgIcon>
              </InputAdornment>
            )
          }}
          aria-label="Search media (quick)"
        />

        {/* action buttons aligned to the right */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            sx={{
              cursor: 'pointer',
              color: 'black',
              borderColor: 'error.main',
              '&:hover': { backgroundColor: 'rgba(211,47,47,0.08)' },
              '& .MuiSvgIcon-root': { color: 'error.main' }
            }}
            onClick={onClick}
            disabled={!Array.isArray(selectedItems) || selectedItems.length === 0}
            variant="outlined"
            color="error"
            type="button"
            aria-label="Delete selected media"
            startIcon={
              <SvgIcon fontSize="small">
                <Trash2Icon />
              </SvgIcon>
            }
          >
            Delete
          </Button>

          <Button color="primary" variant="contained" href="savemedia" size="medium">Add Media</Button>
          <Button color="primary" variant="contained" href="createmedia" size="medium">Create Media</Button>
          <Button color="primary" variant="contained" href="splitmedia" size="medium">Create Split Screen</Button>
        </Box>
      </Box>

      {/* removed the previous card/placeholder to keep tabs flush — slight margin so tabs sit a little lower */}
      <Box sx={{ mt: 2 }} />
    </Box>
  );
};

export default MediaListToolbar;
