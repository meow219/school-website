const express = require('express');
const multer = require('multer');
const { cloudinary } = require('./config');
const Image = require('./models/Image');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (like admin.html, CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload route
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        const { title } = req.body;
        const { buffer } = req.file;

        cloudinary.uploader.upload_stream(
            { folder: 'school-website', use_filename: true, filename_override: title, unique_filename: false, invalidate: true }, // Upload folder on Cloudinary
            async (error, result) => {
                if (error) {
                    return res.status(500).send('Cloudinary Error: ' + error.message);
                }

                // Save image details in MongoDB
                const image = new Image({
                    title,
                    url: result.secure_url,
                });

                await image.save();

                // Send back the response with image URL
                res.json({ message: 'Image uploaded successfully', url: result.secure_url });
            }
        ).end(buffer); // End the stream with the file buffer
    } catch (error) {
        res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
});

// Fetch images route
app.get('/api/images', async (req, res) => {
    try {
        const images = await Image.find();
        res.json(images);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching images: ' + error.message });
    }
});

// Set the port to 5000 or a custom port from environment variables
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
