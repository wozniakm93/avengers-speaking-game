export const ImageUtils = {
    // Converts an image to a canvas and clears white pixels
    makeTransparent: (imageSource, threshold = 240) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imageSource;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // If close to white
                    if (r > threshold && g > threshold && b > threshold) {
                        data[i + 3] = 0; // Alpha to 0
                    }
                }

                ctx.putImageData(imageData, 0, 0);

                const newImg = new Image();
                newImg.src = canvas.toDataURL();
                newImg.onload = () => resolve(newImg);
            };

            img.onerror = reject;
        });
    }
};
