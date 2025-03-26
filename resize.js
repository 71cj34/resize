// SLIDER HANDLING
const slider = document.getElementById('resizeamount');
const sliderValue = document.getElementById('sliderValue');

// Position the value bubble on load
positionBubble();

// Update the bubble position when slider value changes
slider.addEventListener('input', positionBubble);

function positionBubble() {
  const val = slider.value;
  const min = slider.min ? parseFloat(slider.min) : 0;
  const max = slider.max ? parseFloat(slider.max) : 100;
  const newVal = Number(((val - min) * 100) / (max - min));
  
  // Update the text
  sliderValue.innerHTML = val + "x";
  
  // Position the bubble
  sliderValue.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
}



document.getElementById('imageinput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.getElementById('canvas');
                const ctx = canvas.getContext('2d');
                if (img.width > window.innerWidth * 0.6) {
                    const scaleFactor = (window.innerWidth * 0.6) / img.width;
                    canvas.width = window.innerWidth * 0.6;
                    canvas.height = img.height * scaleFactor; 
                } else {
                    canvas.width = img.width;
                    canvas.height = img.height;
                }
                ctx.drawImage(img, 0, 0);

                // Update image dimensions
                document.getElementById('imgdimensions').textContent = `Original Dimensions: ${img.width} x ${img.height}`;
            };
        };
        reader.readAsDataURL(file);
    }
});

function upscaleImage() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const scaleFactor = parseFloat(document.getElementById('resizeamount').value);

    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    const newWidth = originalWidth * scaleFactor;
    const newHeight = originalHeight * scaleFactor;

    const progressBar = document.getElementById('progressbar');
    progressBar.style.display = 'block';

    const imageData = ctx.getImageData(0, 0, originalWidth, originalHeight);
    const resizedImageData = lanczosResize(imageData, newWidth, newHeight, progressBar);

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.putImageData(resizedImageData, 0, 0);

    document.getElementById('imgdimensions').textContent = `Upscaled Dimensions: ${newWidth} x ${newHeight}`;
    progressBar.style.display = 'none';
}

function lanczosResize(imageData, newWidth, newHeight, progressBar) {
    const originalWidth = imageData.width;
    const originalHeight = imageData.height;
    const srcData = imageData.data;
    const dstData = new ImageData(newWidth, newHeight);

    const radius = 3; // Lanczos radius
    const lanczosFilter = function(x) {
        if (x === 0) return 1;
        if (x < -radius || x > radius) return 0;
        return (radius * Math.sin(Math.PI * x) * Math.sin(Math.PI * x / radius)) / (Math.PI * Math.PI * x * x);
    };

    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            const srcX = (x + 0.5) * originalWidth / newWidth - 0.5;
            const srcY = (y + 0.5) * originalHeight / newHeight - 0.5;

            let r = 0, g = 0, b = 0, a = 0;
            let weightSum = 0;

            for (let i = Math.floor(srcX - radius + 1); i <= Math.floor(srcX + radius); i++) {
                for (let j = Math.floor(srcY - radius + 1); j <= Math.floor(srcY + radius); j++) {
                    const distX = srcX - i;
                    const distY = srcY - j;

                    const weightX = lanczosFilter(distX);
                    const weightY = lanczosFilter(distY);
                    const weight = weightX * weightY;

                    if (i >= 0 && i < originalWidth && j >= 0 && j < originalHeight) {
                        const idx = (j * originalWidth + i) * 4;
                        r += srcData[idx] * weight;
                        g += srcData[idx + 1] * weight;
                        b += srcData[idx + 2] * weight;
                        a += srcData[idx + 3] * weight;
                    }

                    weightSum += weight;
                }
            }

            const dstIdx = (y * newWidth + x) * 4;
            dstData.data[dstIdx] = r / weightSum;
            dstData.data[dstIdx + 1] = g / weightSum;
            dstData.data[dstIdx + 2] = b / weightSum;
            dstData.data[dstIdx + 3] = a / weightSum;
        }

        // Update progress bar
        if (y % 10 === 0) {
            progressBar.style.width = `${(y / newHeight) * 100}%`;
        }
    }

    return dstData;
}
