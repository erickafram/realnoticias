/**
 * Middleware de Upload de Arquivos
 * Configuração do Multer para upload de imagens
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Diretório de uploads
const uploadDir = path.join(__dirname, '../../uploads');

// Criar diretórios se não existirem
const directories = ['', '/images', '/thumbnails', '/temp'];
directories.forEach(dir => {
  const fullPath = path.join(uploadDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadDir, 'temp'));
  },
  filename: (req, file, cb) => {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Filtro de tipos de arquivo permitidos
const fileFilter = (req, file, cb) => {
  // Extensões permitidas
  const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|svg)$/i;
  
  // Mimetypes permitidos (incluindo variações)
  const allowedMimetypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/svg',
    // Alguns sistemas enviam esses mimetypes alternativos
    'application/octet-stream', // Quando o browser não consegue detectar
    'image/x-png',
    'image/pjpeg'
  ];
  
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimetypes.includes(file.mimetype.toLowerCase());
  
  // Aceita se a extensão for válida (mesmo que mimetype seja genérico)
  if (extname) {
    return cb(null, true);
  }
  
  // Ou se o mimetype for de imagem válido
  if (mimetype && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  
  console.log('Upload rejeitado:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    extname: path.extname(file.originalname)
  });
  
  cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif, webp, svg)'));
};

// Configuração do Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

// Função para processar e otimizar imagem
const processImage = async (file, options = {}) => {
  const {
    width = 1200,
    height = null,
    quality = 85,
    createThumbnail = true,
    thumbnailWidth = 400,
    thumbnailHeight = 300
  } = options;
  
  const tempPath = file.path;
  const filename = file.filename.replace(/\.[^/.]+$/, '') + '.webp';
  const finalPath = path.join(uploadDir, 'images', filename);
  const thumbnailPath = path.join(uploadDir, 'thumbnails', filename);
  
  try {
    // Processar imagem principal
    let imageProcessor = sharp(tempPath);
    
    // Obter metadados
    const metadata = await imageProcessor.metadata();
    
    // Redimensionar se necessário
    if (width || height) {
      imageProcessor = imageProcessor.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Converter para WebP e salvar
    await imageProcessor
      .webp({ quality })
      .toFile(finalPath);
    
    // Criar thumbnail se solicitado
    if (createThumbnail) {
      await sharp(tempPath)
        .resize(thumbnailWidth, thumbnailHeight, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath);
    }
    
    // Remover arquivo temporário
    fs.unlinkSync(tempPath);
    
    // Obter tamanho do arquivo final
    const stats = fs.statSync(finalPath);
    const finalMetadata = await sharp(finalPath).metadata();
    
    return {
      filename,
      path: finalPath,
      url: `/uploads/images/${filename}`,
      thumbnailUrl: createThumbnail ? `/uploads/thumbnails/${filename}` : null,
      size: stats.size,
      width: finalMetadata.width,
      height: finalMetadata.height,
      mimetype: 'image/webp',
      originalName: file.originalname
    };
  } catch (error) {
    // Limpar arquivo temporário em caso de erro
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw error;
  }
};

// Middleware para processar upload único
const uploadSingle = (fieldName) => {
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      if (!req.file) {
        return next();
      }
      
      try {
        req.processedFile = await processImage(req.file);
        next();
      } catch (error) {
        next(error);
      }
    }
  ];
};

// Middleware para processar múltiplos uploads
const uploadMultiple = (fieldName, maxCount = 10) => {
  return [
    upload.array(fieldName, maxCount),
    async (req, res, next) => {
      if (!req.files || req.files.length === 0) {
        return next();
      }
      
      try {
        req.processedFiles = await Promise.all(
          req.files.map(file => processImage(file))
        );
        next();
      } catch (error) {
        next(error);
      }
    }
  ];
};

// Função para deletar imagem
const deleteImage = (filename) => {
  try {
    if (!filename) return;
    
    const imagePath = path.join(uploadDir, 'images', filename);
    const thumbnailPath = path.join(uploadDir, 'thumbnails', filename);
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    // Não lança erro para não interromper o fluxo
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  processImage,
  deleteImage,
  uploadDir
};
