const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const makeStorage = (subDir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = path.join(uploadDir, subDir);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const IMAGE_PDF = ['image/jpeg', 'image/png', 'application/pdf'];

const DOCUMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword',                                                    
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'application/vnd.ms-excel',                                              
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',    
  'text/plain',                                                            
  'text/csv',                                                              
];

const makeFilter = (allowed) => (req, file, cb) => {
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`File type not allowed. Allowed: ${allowed.join(', ')}`), false);
};

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10 MB default

const upload = multer({
  storage: makeStorage('misc'),
  fileFilter: makeFilter(IMAGE_PDF),
  limits: { fileSize: MAX_SIZE },
});

const uploadDocument = multer({
  storage: makeStorage('documents'),
  fileFilter: makeFilter(DOCUMENT_TYPES),
  limits: { fileSize: MAX_SIZE },
});

module.exports = upload;
module.exports.uploadDocument = uploadDocument;
