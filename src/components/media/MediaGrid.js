import PropTypes from 'prop-types';
import { useState } from 'react';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import { Card, Checkbox } from '@material-ui/core';
import CardMedia from '@mui/material/CardMedia';
const MediaGrid = (props) => {
  const { media } = props || {};
  const [selectedMediaRef, setSelectedMediaRef] = useState([]);
  // console.log('media', media);
  // console.log('props', props);

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
        {media &&
          media.map((item) => (
            <ImageListItem
              style={{
                padding: 5,
                marginBottom: 5
              }}
              key={item.MediaRef}
            >
              <Checkbox
                style={{
                  padding: 5,
                  marginBottom: 2
                }}
                checked={selectedMediaRef.indexOf(item.MediaRef) !== -1}
                onChange={(event) => handleSelectOne(event, item.MediaRef)}
                value="true"
              />
              <CardMedia
                sx={{
                  height: 200,
                  display: 'block',
                  maxWidth: 400,
                  overflow: 'hidden',
                  width: '100%'
                }}
                component={item.MediaType === 'image' ? 'img' : item.MediaType}
                height="400"
                src={item.MediaPath}
                alt={item.label}
                controls
              />

              {/*         
                        <CardMedia
                          sx={{
                            height: 200,
                            display: 'block',
                            maxWidth: 400,
                            overflow: 'hidden',
                            width: '100%',
                          }}
                            component={item.MediaType==="image"?"img":item.MediaType}
                            height="400"
                            src={item.MediaPath}
                            alt={item.label}
                            controls
                          /> */}
              {/* if (item.MediaType==="video") {
          <video width="250" controls>
            <source src={item.MediaPath}/>
          </video>
          
        }

        if (item.MediaType==="image") {
          <img
          src={`${item.MediaPath}?w=150&h=150&fit=crop&auto=format`}
          srcSet={`${item.MediaPath}?w=150&h=150&fit=auto=format&dpr=2 2x`}
          alt={item.MediaName}
          loading="lazy"
        />
        
          
        } */}

              <ImageListItemBar title={item.MediaName} />
            </ImageListItem>
          ))}
      </ImageList>
    </Card>
  );
};
MediaGrid.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  media: PropTypes.array
};

export default MediaGrid;
