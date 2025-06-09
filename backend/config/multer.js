const multer = require('multer');
const storage = multer.memoryStorage(); // Store files in memory as buffers

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
}).fields([
  { name: 'doc_data', maxCount: 1 },
  { name: 'image_data', maxCount: 1 }
]);

module.exports = upload;