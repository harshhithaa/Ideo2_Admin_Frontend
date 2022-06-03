import ImageEditor from '@toast-ui/react-image-editor';
import { useLocation } from 'react-router-dom';
import short from 'short-uuid';

const uuid = short.generate();


const EditImage = () => {
  const location = useLocation();
  

  return (
    <ImageEditor
      includeUI={{
        loadImage: {
          path: location.state,
          name: uuid
        },
        theme: {
          'menu.normalIcon.color': '#ffffff',
          'menu.activeIcon.color': '#ffffff',
          'menu.disabledIcon.color': '#ffffff',
          'menu.hoverIcon.color': '#ffffff',
          'submenu.normalIcon.color': '#ffffff',
          'submenu.activeIcon.color': '#000000'
        },
        menu: ['text','draw','mask','rotate','crop','flip','shape','icon','filter'],
        initMenu: 'text',
        uiSize: {
          width: '100%',
          height: '600px'
        },
        menuBarPosition: 'right'
      }}
      cssMaxHeight={500}
      cssMaxWidth={700}
      selectionStyle={{
        cornerSize: 20,
        rotatingPointOffset: 70
      }}
      usageStatistics={true}
    />
  );
};

export default EditImage;
