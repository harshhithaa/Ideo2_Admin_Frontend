import React, { useEffect } from 'react';
import $ from 'jquery';
import '../styles/splitmedia.css';
import { Typography } from '@material-ui/core';

const SplitMedia = () => {
  $('#modelSelect').val(''); // Reset model selection on page refresh

  useEffect(() => {
    document.getElementById('background').style.visibility = 'hidden'; // Hide canvas until model is selected

    var link = document.getElementById('btn-download');

    link.addEventListener(
      'click',
      function (e) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        var selectedOrientation =
          document.getElementById('orientationSelect').value;

        var selectedModel = document.getElementById('modelSelect').value;
        if (selectedOrientation === 'landscape' && selectedModel === 'model1') {
          canvas.width = 800;
          canvas.height = 340;
        } else if (
          selectedOrientation === 'landscape' &&
          selectedModel === 'model2'
        ) {
          canvas.width = 803;
          canvas.height = 503;
        } else if (
          selectedOrientation === 'portrait' &&
          selectedModel === 'model1'
        ) {
          canvas.width = 300;
          canvas.height = 650;
        } else if (
          selectedOrientation === 'portrait' &&
          selectedModel === 'model2'
        ) {
          canvas.width = 423;
          canvas.height = 653;
        }

        // We need to get all images droped on all canvases and combine them on above canvas
        $('#photo')
          .children('canvas')
          .each(function () {
            var image = this;

            if (
              selectedOrientation === 'landscape' &&
              selectedModel === 'model1'
            ) {
              context.beginPath(); // Simulate CSS padding around images by drawing white rectangles behind images on export
              context.rect(
                image.offsetLeft - 537,
                image.offsetTop - 149,
                image.width,
                image.height
              );
              context.fillStyle = 'white';
              context.fill();

              context.drawImage(
                image,
                image.offsetLeft - 537,
                image.offsetTop - 149,
                image.width,
                image.height
              ); // Draw image
            } else if (
              selectedOrientation === 'landscape' &&
              selectedModel === 'model2'
            ) {
              context.beginPath(); // Simulate CSS padding around images by drawing white rectangles behind images on export
              context.rect(
                image.offsetLeft - 537,
                image.offsetTop - 149,
                image.width,
                image.height
              );
              context.fillStyle = 'white';
              context.fill();

              context.drawImage(
                image,
                image.offsetLeft - 537,
                image.offsetTop - 149,
                image.width,
                image.height
              ); // Draw image
            } else if (
              selectedOrientation === 'portrait' &&
              selectedModel === 'model1'
            ) {
              context.beginPath(); // Simulate CSS padding around images by drawing white rectangles behind images on export
              context.rect(
                image.offsetLeft - 537,
                image.offsetTop - 149,
                image.width,
                image.height
              );
              context.fillStyle = 'white';
              context.fill();

              context.drawImage(
                image,
                image.offsetLeft - 537,
                image.offsetTop - 149,
                image.width,
                image.height
              ); // Draw image
            } else if (
              selectedOrientation === 'portrait' &&
              selectedModel === 'model2'
            ) {
              context.beginPath(); // Simulate CSS padding around images by drawing white rectangles behind images on export
              context.rect(
                image.offsetLeft - 537,
                image.offsetTop - 149,
                image.width,
                image.height
              );
              context.fillStyle = 'white';
              context.fill();

              context.drawImage(
                image,
                image.offsetLeft - 537,
                image.offsetTop - 149,
                image.width,
                image.height
              ); // Draw image
            }
          });

        link.href = canvas.toDataURL(); // Save all combined images to one image
        link.download = `SplitMedia${Math.floor(Math.random() * 10000)}.png`; // Download the image
      },
      false
    );

    makeDroppable(document.querySelector('#dropZone'), function (files) {
      var output = document.querySelector('#images_preview');
      output.innerHTML = '';

      for (var i = 0; i < files.length; i++) {
        if (files[i].type.indexOf('image/') === 0) {
          var reader = new FileReader();
          reader.addEventListener(
            'load',
            function () {
              var image = new Image();
              image.id = Math.random().toString(36).substr(2, 9); // Generate image ID
              image.height = 80;
              image.width = 80;
              image.src = this.result;

              image.ondragstart = function (e) {
                // Register drag event
                e.dataTransfer.setData('text', e.target.id);
              };

              output.appendChild(image); // Add image preview to page
            },
            false
          );
          reader.readAsDataURL(files[i]);
        }
      }
    });
  }, []);

  /***************************************
   * Change model after drop-down select *
   **************************************/
  function modelSelect() {
    var background = document.getElementById('background'); // Keep background canvas

    var photo = document.getElementById('photo');
    while (photo.firstChild) {
      // Remove all child canvases
      photo.removeChild(photo.firstChild);
    }
    photo.appendChild(background); // Attach background canvas back

    var selectedOrientation =
      document.getElementById('orientationSelect').value;

    var selectedModel = document.getElementById('modelSelect').value; // Get the selected model value

    switch (selectedOrientation) {
      case 'landscape':
        if (selectedModel === 'model1') {
          document.getElementById('background').style.visibility = 'visible'; // Make background canvas visible

          background.width = 800;
          background.height = 340;

          var layer1 = document.createElement('canvas'); // Create first square canvas programmatically;
          layer1.className = 'layer';

          layer1.width = 400; // Set square canvas width
          layer1.height = 340; // Set square canvas height
          layer1.style.top = '149px'; // Position square canvas 130px from top
          layer1.style.left = '537px'; // Position square canvas 540px from left
          layer1.style.visibility = 'visible';

          var body = document.getElementById('photo');
          body.appendChild(layer1); // Add first square canvas to photo element on page
          registerEvents(layer1); // Add event listeners that help drag & drop on canvas

          var layer2 = document.createElement('canvas'); // Same as above ... create second square canvas.. etc
          layer2.className = 'layer';
          layer2.width = 400;
          layer2.height = 340;
          layer2.style.top = '149px';
          layer2.style.left = '942px';
          layer2.style.visibility = 'visible';

          var body = document.getElementById('photo');
          body.appendChild(layer2);
          registerEvents(layer2);
        } else if (selectedModel === 'model2') {
          document.getElementById('background').style.visibility = 'visible'; // Make background canvas visible

          background.width = 803;
          background.height = 503;

          var layer1 = document.createElement('canvas'); // Create first square canvas programmatically;
          layer1.className = 'layer';
          layer1.width = 400; // Set square canvas width
          layer1.height = 250; // Set square canvas height
          layer1.style.top = '149px'; // Position square canvas 130px from top
          layer1.style.left = '537px'; // Position square canvas 540px from left
          layer1.style.visibility = 'visible';

          var body = document.getElementById('photo');
          body.appendChild(layer1); // Add first square canvas to photo element on page
          registerEvents(layer1); // Add event listeners that help drag & drop on canvas

          var layer2 = document.createElement('canvas'); // Same as above ... create second square canvas.. etc
          layer2.className = 'layer';
          layer2.width = 400;
          layer2.height = 250;
          layer2.style.top = '149px';
          layer2.style.left = '942px';
          layer2.style.visibility = 'visible';

          var body = document.getElementById('photo');
          body.appendChild(layer2);
          registerEvents(layer2);

          var layer3 = document.createElement('canvas');
          layer3.className = 'layer';
          layer3.width = 400;
          layer3.height = 250;
          layer3.style.top = '402px';
          layer3.style.left = '537px';
          layer3.style.visibility = 'visible';

          var body = document.getElementById('photo');
          body.appendChild(layer3);
          registerEvents(layer3);

          var layer4 = document.createElement('canvas');
          layer4.className = 'layer';
          layer4.width = 400;
          layer4.height = 250;
          layer4.style.top = '402px';
          layer4.style.left = '942px';
          layer4.style.visibility = 'visible';

          var body = document.getElementById('photo');
          body.appendChild(layer4);
          registerEvents(layer4);
        }

        break;
      case 'portrait':
        if (selectedModel === 'model1') {
          document.getElementById('background').style.visibility = 'visible'; // Make background canvas visible

          background.width = 300;
          background.height = 650;

          var layer1 = document.createElement('canvas'); // Create first square canvas programmatically;
          layer1.className = 'layer';

          layer1.width = 300; // Set square canvas width
          layer1.height = 325; // Set square canvas height
          layer1.style.top = '149px'; // Position square canvas 130px from top
          layer1.style.left = '537px'; // Position square canvas 540px from left
          layer1.style.visibility = 'visible';

          var body = document.getElementById('photo');
          body.appendChild(layer1); // Add first square canvas to photo element on page
          registerEvents(layer1); // Add event listeners that help drag & drop on canvas

          var layer2 = document.createElement('canvas'); // Same as above ... create second square canvas.. etc
          layer2.className = 'layer';
          layer2.width = 300;
          layer2.height = 325;
          layer2.style.top = '478px';
          layer2.style.left = '537px';
          layer2.style.visibility = 'visible';

          var body = document.getElementById('photo');
          body.appendChild(layer2);
          registerEvents(layer2);
        } else if (selectedModel === 'model2') {
          document.getElementById('background').style.visibility = 'visible'; // Make background canvas visible

          background.width = 423;
          background.height = 653;

          var layer1 = document.createElement('canvas'); // Create first square canvas programmatically;
          layer1.className = 'layer';
          layer1.width = 209; // Set square canvas width
          layer1.height = 324; // Set square canvas height
          layer1.style.top = '149px'; // Position square canvas 130px from top
          layer1.style.left = '537px'; // Position square canvas 540px from left
          layer1.style.visibility = 'visible';

          var body = document.getElementById('photo');
          body.appendChild(layer1); // Add first square canvas to photo element on page
          registerEvents(layer1); // Add event listeners that help drag & drop on canvas

          var layer2 = document.createElement('canvas'); // Same as above ... create second square canvas.. etc
          layer2.className = 'layer';
          layer2.width = 209;
          layer2.height = 324;
          layer2.style.top = '149px';
          layer2.style.left = '751px';
          layer2.style.visibility = 'visible';

          var body = document.getElementById('photo');
          body.appendChild(layer2);
          registerEvents(layer2);

          var layer3 = document.createElement('canvas');
          layer3.className = 'layer';
          layer3.width = 209;
          layer3.height = 324;
          layer3.style.top = '478px';
          layer3.style.left = '537px';
          layer3.style.visibility = 'visible';

          var body = document.getElementById('photo');
          body.appendChild(layer3);
          registerEvents(layer3);

          var layer4 = document.createElement('canvas');
          layer4.className = 'layer';
          layer4.width = 209;
          layer4.height = 324;
          layer4.style.top = '478px';
          layer4.style.left = '751px';
          layer4.style.visibility = 'visible';

          var body = document.getElementById('photo');
          body.appendChild(layer4);
          registerEvents(layer4);
        }
        break;
      default:
        document.getElementById('background').style.visibility = 'hidden'; // Hide canvas until model is selected
    }
  }

  function registerEvents(canvas) {
    canvas.ondragenter = function () {
      canvas.style.border = 'dashed 2px #555'; // Change the canvas borders when hovering
    };
    canvas.ondragleave = function () {
      canvas.style.border = 'none'; // Reset canvas borders when hovering is not active
    };
    canvas.ondragover = function (e) {
      e.preventDefault();
    };
    canvas.ondrop = function (e) {
      e.preventDefault();
      var id = e.dataTransfer.getData('text');
      var dropImage = document.getElementById(id);
      canvas.style.border = 'none'; // Reset canvas borders after image drop

      var context = canvas.getContext('2d');
      context.drawImage(dropImage, 0, 0, canvas.width, canvas.height); // Draw and stretch image to fill canvas
    };
  }

  /*
   * This file is used for drag & drop file upload and image preview
   */

  /************************************************************
   * Add the JavaScript support for drag & drop/browse upload *
   ***********************************************************/
  function makeDroppable(element, callback) {
    var input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('multiple', true);
    input.style.display = 'none';
    input.addEventListener('change', function (e) {
      triggerCallback(e, callback);
    });
    element.appendChild(input);

    element.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      element.classList.add('dragover');
    });

    element.addEventListener('dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove('dragover');
    });

    element.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove('dragover');
      triggerCallback(e, callback);
    });

    element.addEventListener('click', function () {
      input.value = null;
      input.click();
    });
  }

  function triggerCallback(e, callback) {
    if (!callback || typeof callback !== 'function') {
      return;
    }
    var files;
    if (e.dataTransfer) {
      files = e.dataTransfer.files;
    } else if (e.target) {
      files = e.target.files;
    }
    callback.call(null, files);
  }

  /*************************************************************************
   * After drag & drop upload, create image elements and add image preview *
   * Make images draggable to canvas and register mouse & drag events      *
   ************************************************************************/

  return (
    <>
      <Typography color="textPrimary" variant="h2" textAlign={'center'}>
        Create Split Screen
      </Typography>
      <div className="row">
        <div className="column">
          <div id="leftSide">
            <div id="dropZone">
              <p>
                To upload your images <br />
                Click <u>here</u>!
              </p>
            </div>

            <div id="images_preview"></div>
          </div>
        </div>

        <div id="photo">
          <canvas id="background"></canvas>
        </div>

        <div id="images"></div>
      </div>
      <div style={{ marginTop: '20px' }}>
        <div id="buttonsArea">
          <select
            id="orientationSelect"
            onChange={() => {
              modelSelect();
            }}
          >
            <option value="">Select the Orientation</option>
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>

          <select
            id="modelSelect"
            onChange={() => {
              modelSelect();
            }}
            style={{ marginTop: '10px' }}
          >
            <option value="">Select the pattern</option>
            <option value="model1">2x1</option>
            <option value="model2">2x2</option>
          </select>

          <div style={{ marginTop: '10px' }}>
            <a href="#" className="button" id="btn-download">
              Save your Split Media
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default SplitMedia;
