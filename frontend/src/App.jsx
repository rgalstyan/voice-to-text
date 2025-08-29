import React, { useState, useRef } from 'react';
import axios from 'axios';

function App() {
    const [file, setFile] = useState(null);
    const [transcription, setTranscription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            // Проверяем формат файла
            const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/x-wav'];
            if (allowedTypes.includes(selectedFile.type) || selectedFile.name.match(/\.(mp3|wav|ogg)$/i)) {
                setFile(selectedFile);
                setError('');
            } else {
                setError('Пожалуйста, выберите аудиофайл (MP3, WAV, OGG)');
                setFile(null);
            }
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile) {
            const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/x-wav'];
            if (allowedTypes.includes(droppedFile.type) || droppedFile.name.match(/\.(mp3|wav|ogg)$/i)) {
                setFile(droppedFile);
                setError('');
            } else {
                setError('Пожалуйста, выберите аудиофайл (MP3, WAV, OGG)');
            }
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const transcribeAudio = async () => {
        if (!file) return;

        setLoading(true);
        setError('');
        setTranscription('');
        setProgress(0);

        const formData = new FormData();
        formData.append('audio', file);

        try {
            const response = await axios.post('http://localhost:3001/api/transcribe', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setProgress(percentCompleted);
                },
            });

            setTranscription(response.data.text);
        } catch (err) {
            setError(
                err.response?.data?.error ||
                'Произошла ошибка при транскрипции аудио. Проверьте соединение с сервером.'
            );
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };

    const resetForm = () => {
        setFile(null);
        setTranscription('');
        setError('');
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Транскрипция армянского аудио
                    </h1>
                    <p className="text-gray-600">
                        Загрузите аудиофайл и получите текстовую расшифровку на армянском языке
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    {/* Зона загрузки файла */}
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                            file
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => {
                            if (!file && fileInputRef.current) {
                                fileInputRef.current.click();
                            }
                        }}
                    >
                        {file ? (
                            <div className="space-y-2">
                                <div className="text-green-600">
                                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-green-700 font-medium">{file.name}</p>
                                <p className="text-xs text-green-600">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-gray-400">
                                    <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-600 mb-2">
                                        Перетащите аудиофайл сюда
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        или нажмите кнопку "Выбрать файл" ниже
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Поддерживаемые форматы: MP3, WAV, OGG (до 25MB)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Кнопки */}
                    <div className="flex gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".mp3,.wav,.ogg,.flac,.m4a,.webm,audio/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => {
                                console.log('Button clicked'); // Для отладки
                                if (fileInputRef.current) {
                                    fileInputRef.current.click();
                                }
                            }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>Выбрать файл</span>
                        </button>

                        {file && (
                            <button
                                onClick={resetForm}
                                className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Кнопка транскрипции */}
                    {file && (
                        <button
                            onClick={transcribeAudio}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Обработка...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    </svg>
                                    <span>Расшифровать аудио</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Прогресс-бар */}
                    {loading && progress > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Загрузка файла</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Ошибки */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex">
                                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Результат транскрипции */}
                    {transcription && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="font-medium text-green-900">Результат транскрипции:</h3>
                            </div>
                            <div className="bg-white rounded-lg p-4 border">
                                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                                    {transcription}
                                </p>
                            </div>
                            <button
                                onClick={() => navigator.clipboard.writeText(transcription)}
                                className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center space-x-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                <span>Скопировать текст</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;