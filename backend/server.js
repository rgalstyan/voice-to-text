const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Настройка OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Убедитесь, что у вас есть API ключ в .env файле
});

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // URL фронтенда
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Создаем папку для временных файлов
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB лимит (максимум для gpt-4o-mini-transcribe API)
    },
    fileFilter: (req, file, cb) => {
        console.log('Проверка файла:', file.originalname, 'MIME:', file.mimetype);

        // Проверяем формат файла
        const allowedMimes = [
            'audio/mp3',
            'audio/mpeg',
            'audio/wav',
            'audio/x-wav',
            'audio/ogg',
            'audio/flac',
            'audio/m4a',
            'audio/mp4',
            'audio/webm',
            'audio/aac'
        ];

        const allowedExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.webm', '.aac'];
        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
            console.log('✅ Файл принят:', file.originalname);
            cb(null, true);
        } else {
            console.log('❌ Файл отклонён:', file.originalname, 'MIME:', file.mimetype);
            cb(new Error('Неподдерживаемый формат аудиофайла. Поддерживаются: MP3, WAV, OGG, FLAC, M4A, WEBM, AAC'), false);
        }
    }
});

// Функция для транскрипции аудио через gpt-4o-mini-transcribe API
async function transcribeAudio(filePath) {
    try {
        console.log('🎤 Отправка файла на транскрипцию:', path.basename(filePath));

        const response = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "gpt-4o-mini-transcribe",
            language: "hy", // армянский язык (ISO 639-1 код)
            response_format: "text",
            temperature: 0.2 // Для более точной транскрипции
        });
        console.log(response);
        console.log('✅ Транскрипция получена успешно, длина:', response.length, 'символов');
        return response;
    } catch (error) {
        console.error('❌ Ошибка при транскрипции:', error.message);

        // Более детальная обработка ошибок OpenAI
        if (error.status === 429) {
            throw new Error('rate_limit_exceeded');
        } else if (error.status === 401) {
            throw new Error('invalid_api_key');
        } else if (error.status === 413) {
            throw new Error('file_too_large');
        } else if (error.message.includes('audio')) {
            throw new Error('unsupported_file_format');
        }

        throw error;
    }
}

// Альтернативная функция для локальной модели (если OpenAI недоступен)
async function transcribeAudioLocal(filePath) {
    console.log('🔧 Использование локальной модели для файла:', path.basename(filePath));

    // Здесь можно использовать локальную модель gpt-4o-mini-transcribe
    // Например, через Python subprocess:

    // const { spawn } = require('child_process');
    // return new Promise((resolve, reject) => {
    //   const python = spawn('python3', ['whisper_transcribe.py', filePath, 'hy']);
    //   let result = '';
    //   let errorOutput = '';
    //
    //   python.stdout.on('data', (data) => {
    //     result += data.toString();
    //   });
    //
    //   python.stderr.on('data', (data) => {
    //     errorOutput += data.toString();
    //   });
    //
    //   python.on('close', (code) => {
    //     if (code === 0) {
    //       resolve(result.trim());
    //     } else {
    //       reject(new Error(`Python script failed: ${errorOutput}`));
    //     }
    //   });
    // });

    // Заглушка для демонстрации (замените на реальную модель)
    const demoTexts = [
        "Բարև ձեզ! Սա օրինակ է տեքստի հայերեն լեզվով:",
        "Այս ֆայլը հաջողությամբ մշակվեց տեղական մոդելով:",
        "Խնդրում ենք կարգավորել OpenAI API բանալին ավելի ճշգրիտ արդյունքների համար:"
    ];

    const randomText = demoTexts[Math.floor(Math.random() * demoTexts.length)];

    // Симуляция обработки
    await new Promise(resolve => setTimeout(resolve, 2000));

    return randomText;
}

// API endpoint для транскрипции
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    const startTime = Date.now();

    try {
        if (!req.file) {
            console.log('❌ Аудиофайл не был загружен');
            return res.status(400).json({
                error: 'Аудиофайл не был загружен. Пожалуйста, выберите файл.'
            });
        }

        console.log('📁 Получен файл:', {
            name: req.file.originalname,
            size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
            mimetype: req.file.mimetype,
            path: req.file.path
        });

        const filePath = req.file.path;

        // Проверяем размер файла
        const stats = fs.statSync(filePath);
        if (stats.size > 25 * 1024 * 1024) {
            // Удаляем файл
            fs.unlinkSync(filePath);
            console.log('❌ Файл слишком большой:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
            return res.status(400).json({
                error: 'Файл слишком большой. Максимальный размер: 25MB'
            });
        }

        let transcribedText;
        let usedService = 'unknown';

        // Пытаемся использовать OpenAI Whisper API
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
            try {
                console.log('🤖 Использование OpenAI gpt-4o-mini-transcribe API...');
                transcribedText = await transcribeAudio(filePath);
                usedService = 'OpenAI gpt-4o-mini-transcribe';
            } catch (openaiError) {
                console.error('❌ Ошибка OpenAI API:', openaiError.message);

                let errorMessage = 'Ошибка OpenAI API';

                if (openaiError.message === 'rate_limit_exceeded') {
                    errorMessage = 'Превышена квота API. Попробуйте позже или проверьте ваш план OpenAI.';
                } else if (openaiError.message === 'invalid_api_key') {
                    errorMessage = 'Неверный API ключ OpenAI. Проверьте файл .env';
                } else if (openaiError.message === 'file_too_large') {
                    errorMessage = 'Файл слишком большой для OpenAI API.';
                } else if (openaiError.message === 'unsupported_file_format') {
                    errorMessage = 'OpenAI не поддерживает этот формат файла.';
                }

                // Удаляем файл и возвращаем ошибку
                fs.unlinkSync(filePath);
                return res.status(500).json({ error: errorMessage });
            }
        } else {
            console.log('⚠️  OpenAI API ключ не найден, используем локальную модель...');
            try {
                transcribedText = await transcribeAudioLocal(filePath);
                usedService = 'Локальная модель (демо)';
            } catch (localError) {
                console.error('❌ Ошибка локальной модели:', localError.message);
                fs.unlinkSync(filePath);
                return res.status(500).json({
                    error: 'Ошибка обработки аудио. Проверьте формат файла и попробуйте снова.'
                });
            }
        }

        // Удаляем временный файл
        fs.unlinkSync(filePath);
        console.log('🗑️  Временный файл удален:', path.basename(filePath));

        const processingTime = Date.now() - startTime;
        console.log(`✅ Транскрипция завершена за ${processingTime}ms с помощью: ${usedService}`);

        // Возвращаем результат
        res.json({
            text: transcribedText,
            filename: req.file.originalname,
            size: req.file.size,
            service: usedService,
            processingTime: processingTime
        });

    } catch (error) {
        console.error('💥 Общая ошибка при обработке запроса:', error);

        // Удаляем файл в случае ошибки
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log('🗑️  Временный файл удален после ошибки');
        }

        // Обрабатываем различные типы ошибок
        let errorMessage = 'Произошла неожиданная ошибка при обработке аудиофайла';

        if (error.message.includes('ENOENT')) {
            errorMessage = 'Файл не найден. Попробуйте загрузить файл заново.';
        } else if (error.message.includes('EMFILE')) {
            errorMessage = 'Сервер перегружен. Попробуйте позже.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Превышено время ожидания. Попробуйте с файлом меньшего размера.';
        }

        res.status(500).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint для проверки статуса сервера
app.get('/api/status', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        hasOpenAiKey: !!process.env.OPENAI_API_KEY,
        environment: process.env.NODE_ENV || 'production',
        uploadsDir: uploadsDir,
        maxFileSize: '25MB'
    });
});

// Endpoint для получения информации о поддерживаемых форматах
app.get('/api/formats', (req, res) => {
    res.json({
        supportedFormats: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'webm', 'aac'],
        maxFileSize: 25 * 1024 * 1024,
        maxFileSizeHuman: '25MB',
        supportedMimeTypes: [
            'audio/mp3',
            'audio/mpeg',
            'audio/wav',
            'audio/x-wav',
            'audio/ogg',
            'audio/flac',
            'audio/m4a',
            'audio/mp4',
            'audio/webm',
            'audio/aac'
        ]
    });
});

// Обработка ошибок multer
app.use((error, req, res, next) => {
    console.error('🚫 Middleware ошибка:', error.message);

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'Файл слишком большой. Максимальный размер: 25MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Можно загрузить только один файл за раз'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Неожиданное поле файла. Используйте поле "audio"'
            });
        }

        return res.status(400).json({
            error: 'Ошибка загрузки файла: ' + error.message
        });
    }

    if (error.message.includes('формат')) {
        return res.status(400).json({
            error: error.message
        });
    }

    // Общая ошибка
    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404 обработчик
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint не найден',
        availableEndpoints: [
            'POST /api/transcribe - Транскрипция аудио',
            'GET /api/status - Статус сервера',
            'GET /api/formats - Поддерживаемые форматы'
        ]
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Получен сигнал SIGINT. Завершение работы сервера...');

    // Очистка временных файлов
    try {
        const files = fs.readdirSync(uploadsDir);
        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            fs.unlinkSync(filePath);
            console.log('🗑️  Удален временный файл:', file);
        });
    } catch (error) {
        console.error('Ошибка при очистке временных файлов:', error.message);
    }

    process.exit(0);
});

// Запуск сервера
const server = app.listen(PORT, () => {
    console.log('\n🚀 ============================================');
    console.log(`📡 Сервер запущен на: http://localhost:${PORT}`);
    console.log(`📝 API endpoint: http://localhost:${PORT}/api/transcribe`);
    console.log(`📊 Статус: http://localhost:${PORT}/api/status`);
    console.log(`🔑 OpenAI API ключ: ${process.env.OPENAI_API_KEY ? '✅ найден' : '❌ не найден'}`);
    console.log(`📁 Папка uploads: ${uploadsDir}`);
    console.log(`🌍 Среда: ${process.env.NODE_ENV || 'production'}`);
    console.log('============================================\n');

    // Создаем папку uploads если её нет
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`📁 Создана папка uploads: ${uploadsDir}`);
    }

    // Проверяем доступность OpenAI API
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
        console.log('🤖 OpenAI gpt-4o-mini-transcribe API готов к использованию');
    } else {
        console.log('⚠️  OpenAI API ключ не настроен. Будет использована локальная модель (демо режим)');
        console.log('💡 Добавьте OPENAI_API_KEY в файл .env для полной функциональности');
    }
});

// Обработка ошибок сервера
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Порт ${PORT} уже используется. Попробуйте другой порт или закройте приложение, использующее этот порт.`);
        process.exit(1);
    } else {
        console.error('❌ Ошибка сервера:', error.message);
    }
});

module.exports = app;