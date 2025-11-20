import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  SvgIcon,
  Grid
} from '@mui/material';
import { Search as SearchIcon, Trash2 as Trash2Icon } from 'react-feather';
import { useNavigate } from 'react-router';

/*
  MediaListToolbar:
  - uses `media` prop to search uploaded items
  - single search input (no duplicate)
  - shows small thumbnails for matching results on the right
*/

const MediaListToolbar = ({ media = [], onClick, selectedItems = [], query = '', onQueryChange = () => {} }) => {
   const navigate = useNavigate();
 
   const buildSrc = (rawPath) => {
     if (!rawPath) return null;
     if (/^https?:\/\//i.test(rawPath)) return rawPath;
     if (rawPath.startsWith('/')) return `${window.location.origin}${rawPath}`;
     if (rawPath.indexOf('undefined') !== -1) return null;
     try { return rawPath.replace(/ /g, '%20'); } catch (e) { return rawPath; }
   };

   // toolbar no longer renders thumbnails results; parent handles filtering
   // keep media prop available if needed
   useMemo(() => {}, [media]);
 
   return (
     <Box>
       <Grid container sx={{ display: 'flex', justifyContent: 'flex-end' }}>
         <Button
           sx={{
             mx: 1,
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
         >
           <SvgIcon fontSize="small">
             <Trash2Icon />
           </SvgIcon>
           Delete
         </Button>

         <Grid item>
           <Button color="primary" variant="contained" href="savemedia">Add Media</Button>
           <Button sx={{ mx: 1 }} color="primary" variant="contained" href="createmedia">Create Media</Button>
           <Button sx={{ mt: window.innerWidth < 400 ? 1 : 0, mx: 1 }} color="primary" variant="contained" href="splitmedia">Create Split Screen</Button>
         </Grid>
       </Grid>
 
       <Box sx={{ mt: 3 }}>
         <Card>
           <CardContent>
             <Grid container alignItems="center" spacing={2}>
               <Grid item xs>
                 {/* single search input wired to parent via onQueryChange */}
                 <TextField
                   fullWidth
                   value={query}
                   onChange={(e) => onQueryChange(e.target.value)}
                   InputProps={{
                     startAdornment: (
                       <InputAdornment position="start">
                         <SvgIcon fontSize="small" color="action">
                           <SearchIcon />
                         </SvgIcon>
                       </InputAdornment>
                     )
                   }}
                   placeholder="Search Media"
                   variant="outlined"
                 />
               </Grid>
 
               {/* thumbnails removed — parent will filter and MediaGrid displays matching items in tabs */}
               </Grid>
             </CardContent>
           </Card>
         </Box>
       </Box>
     );
   };
 
 export default MediaListToolbar;
