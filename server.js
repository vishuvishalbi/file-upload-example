const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const UPLOAD_FOLDER = 'uploads';
const MAX_CHUNK_SIZE = 1024 * 1024 * 5; // 5MB

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_FOLDER);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
    const { file } = req;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }


    const combinedFilePath = path.join(__dirname, UPLOAD_FOLDER, req.body.filename);// Writing the chunk to file on server
    //console.log(" FILE NAME ", combinedFilePath, file)

    const combinedFileStream = fs.createWriteStream(combinedFilePath, { flags: 'a' });
    const chunkFilename = path.join(__dirname, UPLOAD_FOLDER, 'blob');
    const chunkFileStream = fs.createReadStream(chunkFilename);//reading from uploaded blob

    chunkFileStream.pipe(combinedFileStream, { end: false }); // Pipe the chunk to the combined file

    chunkFileStream.on('end', () => {
        fs.unlinkSync(chunkFilename);
        res.status(200).json({ message: 'Chunk uploaded successfully' });
    });
});

app.get('/file-and-folder-list', (req, res) => {
    const folderPath = path.join(__dirname, UPLOAD_FOLDER);
  
    fs.readdir(folderPath, (err, files) => {

      if (err) {
        console.error('Error reading directory:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      const fileList = [];
  
      // Iterate through the files and folders
      files.forEach((file) => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        const isDirectory = stats.isDirectory();
  
        fileList.push({
          name: file,
          isDirectory,
        });
      });
  
      res.status(200).json({ fileList });
    });
  });

app.delete('/delete-file', (req, res) => {
    const { filename } = req.query;
    const filePath = path.join(__dirname, UPLOAD_FOLDER, filename);
  
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
  
        console.log(`Deleted file: ${filename}`);
        res.status(200).json({ message: 'File deleted successfully' });
      });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  });
  

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
