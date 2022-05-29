import ImageEditor from '@toast-ui/react-image-editor';
import { useLocation } from 'react-router-dom';

const EditImage = () => {
  const location = useLocation();

  return (
    <ImageEditor
      includeUI={{
        loadImage: {
          path: location.state,
          name: 'SampleImage'
        },
        theme: {
          'menu.normalIcon.color': '#ffffff',
          'menu.activeIcon.color': '#ffffff',
          'menu.disabledIcon.color': '#ffffff',
          'menu.hoverIcon.color': '#ffffff',
          'submenu.normalIcon.color': '#ffffff',
          'submenu.activeIcon.color': '#000000'
        },
        menu: ['text'],
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
