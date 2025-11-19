import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import { Card, Checkbox } from '@mui/material';
import CardMedia from '@mui/material/CardMedia';
const MediaGrid = (props) => {
  const { media } = props || {};
  const [selectedMediaRef, setSelectedMediaRef] = useState([]);

  const handleSelectOne = (event, MediaRef) => {
    const selectedIndex = selectedMediaRef.indexOf(MediaRef);
    let newSelectedMediaRefs = [];

    if (selectedIndex === -1) {
      newSelectedMediaRefs = newSelectedMediaRefs.concat(
        selectedMediaRef,
        MediaRef
      );
    } else if (selectedIndex === 0) {
      newSelectedMediaRefs = newSelectedMediaRefs.concat(
        selectedMediaRef.slice(1)
      );
    } else if (selectedIndex === selectedMediaRef.length - 1) {
      newSelectedMediaRefs = newSelectedMediaRefs.concat(
        selectedMediaRef.slice(0, -1)
      );
    } else if (selectedIndex > 0) {
      newSelectedMediaRefs = newSelectedMediaRefs.concat(
        selectedMediaRef.slice(0, selectedIndex),
        selectedMediaRef.slice(selectedIndex + 1)
      );
    }
    props.setselected(newSelectedMediaRefs);

    setSelectedMediaRef(newSelectedMediaRefs);
    console.log('newSelectedMediaRefs', newSelectedMediaRefs);
  };

  // safe src builder
  const buildSrc = (rawPath) => {
    if (!rawPath) return null;

    // debug: show exact value returned by backend
    // remove this log once fixed
    console.log('MediaPath from server:', rawPath);

    // if absolute URL, return as-is
    if (/^https?:\/\//i.test(rawPath)) return rawPath;

    // if already percent-encoded and starts with '/', make absolute using current origin
    if (rawPath.startsWith('/')) return `${window.location.origin}${rawPath}`;

    // avoid prepending undefined: do not use any external prefix variable here
    // if it's a relative path, return as-is (browser will resolve relative to current route)
    // replace accidental leading "undefined" segments
    if (rawPath.indexOf('undefined') !== -1) {
      console.warn('MediaPath contains "undefined":', rawPath);
      return null;
    }

    // as last resort, encode only spaces to avoid double-encoding issues
    try {
      return rawPath.replace(/ /g, '%20');
    } catch (e) {
      return rawPath;
    }
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
<ImageList
  sx={{ width: '100%', height: 450 }}
  variant="quilted"
  cols={window.innerWidth < 500 ? 2 : 5}
  gap={8}
>
  {(Array.isArray(media) && media.length > 0) ? (
    media.map((item) => {
      const src = buildSrc(item && item.MediaPath);
      const isImage = item && item.MediaType && item.MediaType.startsWith && item.MediaType.startsWith('image');
      const isVideo = item && item.MediaType && item.MediaType.startsWith && item.MediaType.startsWith('video');

      return (
        <ImageListItem
          style={{ padding: 5, marginBottom: 5 }}
          key={item.MediaRef}
        >
          <Checkbox
            style={{ padding: 5, marginBottom: 2 }}
            checked={selectedMediaRef.indexOf(item.MediaRef) !== -1}
            onChange={(event) => handleSelectOne(event, item.MediaRef)}
          />

          {src ? (
            isImage ? (
              <CardMedia
                sx={{
                  height: 200,
                  display: 'block',
                  maxWidth: 400,
                  overflow: 'hidden',
                  width: '100%'
                }}
                component={item.MediaType === 'image' ? 'img' : item.MediaType}
                src={item.MediaPath}
                alt={item.MediaName}
                controls
              />
            ) : isVideo ? (
              <video src={src} controls style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            ) : (
              // unknown type — try to render image first, then video fallback
              <img src={src} alt={item?.MediaName} style={{ width: '100%', height: 140, objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )
          ) : (
            <div style={{ width: '100%', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
              No media URL
            </div>
          )}

          <ImageListItemBar title={item.MediaName} />
        </ImageListItem>
      );
    })
  ) : (
    <></>  // prevents undefined children
  )}
</ImageList>

    </Card>
  );
};
MediaGrid.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  media: PropTypes.array
};

export default MediaGrid;
