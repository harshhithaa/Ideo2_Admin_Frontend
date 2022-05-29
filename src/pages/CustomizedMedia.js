import React, { useState } from 'react';
import 'tui-image-editor/dist/tui-image-editor.css';
import FileSaver from 'file-saver';
import { Button, Card, Modal, Typography } from '@material-ui/core';
import background1 from 'src/assets/backgrounds/background1.jpg';
import background2 from 'src/assets/backgrounds/background2.jpg';
import background3 from 'src/assets/backgrounds/background3.jpg';
import background4 from 'src/assets/backgrounds/background4.jpg';
import background5 from 'src/assets/backgrounds/background5.jpg';
import { useNavigate } from 'react-router-dom';

const CustomizedMedia = () => {
  const [selectedImage, setSelectedImage] = useState();
  const [active, setActive] = useState(false);
  const images = [
    background1,
    background2,
    background3,
    background4,
    background5
  ];

  const navigate = useNavigate();

  const handleClick = (img) => {
    setSelectedImage(img);
    setActive(true);
  };

  return (
    <>
      <Typography
        color="textSecondary"
        gutterBottom
        variant="h4"
        sx={{ padding: '10px', marginTop: '10px' }}
      >
        Please Select a background or Proceed to Upload your own image
      </Typography>
      <Card
        sx={{
          padding: '10px',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        {images.map((image, index) => (
          <img
            key={index}
            alt="background"
            src={image}
            style={{
              width: '200px',
              cursor: 'pointer'
            }}
            onClick={() => handleClick(image)}
          />
        ))}
      </Card>
      <Button
        color="primary"
        size="large"
        variant="contained"
        sx={{ marginTop: '20px', marginLeft: '10px' }}
        onClick={() => {
          navigate('/app/editimage', { state: selectedImage });
        }}
      >
        Proceed
      </Button>
      <Modal
        open={active}
        onClose={() => setActive(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Card
          sx={{
            top: '50%',
            left: '50%',
            position: 'absolute',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <img
            src={selectedImage}
            alt="background"
            style={{
              maxWidth: '100%'
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 10
            }}
          >
            <Button
              color="primary"
              size="large"
              variant="contained"
              sx={{ alignItems: 'center' }}
              onClick={() => {
                navigate('/app/editimage', { state: selectedImage });
              }}
            >
              Proceed
            </Button>
          </div>
        </Card>
      </Modal>
    </>
  );
};

export default CustomizedMedia;
