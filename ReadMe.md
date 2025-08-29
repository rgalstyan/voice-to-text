# 🎯 Armenian Audio Transcription – Complete Guide
## 🚀 Running the Project

### Terminal 1 – Backend:
```bash
cd backend
npm run dev
```
The server will run at http://localhost:3001

### Terminal 2 – Frontend:
```bash
cd frontend  
npm start
```
The app will open at http://localhost:3000

## 🔑 Getting an OpenAI API Key

1. Sign up at https://platform.openai.com/
2. Go to API Keys: https://platform.openai.com/api-keys
3. Create a new key
4. Add it to the backend/.env file:
```env
OPENAI_API_KEY=sk-your-real-key-here
```

⚠️ **Important:** Make sure your OpenAI account has available credits!

## 📱 Using the App

1. Open http://localhost:3000
2. Drag and drop an audio file into the upload area or click “Choose File”
3. Supported formats: MP3, WAV, OGG, FLAC, M4A, WEBM
4. Maximum file size: 25MB
5. Click “Transcribe Audio”
6. Wait for the result and copy the text

## 🛠️ Troubleshooting

### CORS ошибки:
Make sure the backend runs on port 3001 and the frontend on 3000.

### Installation Issues:
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### OpenAI API Issues:
- Check your API key in the .env file
- Make sure your account has credits
- Check quotas and limits

### File Upload Errors:
- Verify the file format (MP3, WAV, OGG, etc.)
- Ensure the file size does not exceed 25MB
- Check permissions for the uploads folder

## 🌟 Additional Options

### Alternatives to OpenAI API:

1. **AssemblyAI**:
```bash
npm install assemblyai
```

2. **Azure Speech Services**:
```bash
npm install microsoft-cognitiveservices-speech-sdk
```

3. **Google Cloud Speech**:
```bash
npm install @google-cloud/speech
```

### Local Whisper (Python):
```bash
pip install openai-whisper
```

Create a file `whisper_local.py`:
```python
import whisper
import sys

model = whisper.load_model("base")
result = model.transcribe(sys.argv[1], language="hy")
print(result["text"])
```
