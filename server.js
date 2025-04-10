const express = require('express');
const fs = require('fs').promises;
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware 設定
app.use(cors());
app.use(express.json());

// 檔案路徑
const defaultLogFilePath = './test_data/security/attack.json';
const defaultAiRole = '你是一個資安分析攻擊的專家';
const defaultHelpMess = '幫我分析提供的Log，順便整理歸納LOG內的資料，並簡單說明有發生的資安事件，用繁體中文回答我。'

// 新增的分析端點：處理日誌檔案並發送到外部 API
app.post('/api/analyze-logs', async (req, res) => {
    try {
        // 從請求中獲取檔案路徑，預設為 attack.json
        const filePath = req.body.filePath || defaultLogFilePath;
        const aiRole = req.body.aiRole || defaultAiRole;
        const helpMessage = req.body.helpMessage || defaultHelpMess;
        // 讀取並處理檔案內容
        const fileContent = await fs.readFile(filePath, 'utf8');
        const lines = fileContent.split('\n').slice(0, 100);
        const processedContent = lines
            .map(line => line.replace(/\r/g, '').replace(/"/g, '\\"'))
            .join('\n');
        
        // 發送內容到外部 API，並啟用流式回應
        const response = await axios({
            method: 'POST',
            url: 'http://10.168.10.30:11434/api/chat',
            data: {
                model: 'gemma3:4b',
                messages: [
                    { role: 'system', content: `'${aiRole}'` },
                    { role: 'user', content: `'${helpMessage}' '${processedContent}'` }
                ],
                stream: true
            },
            responseType: 'stream' // 告訴 axios 返回流
        });

        // 設置回應頭，表明這是流式內容
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        // 直接將外部 API 的流轉發給前端
        response.data.pipe(res);
    } catch (error) {
        res.status(500).json({ message: '分析失敗', error: error.message });
    }
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`API Server 運行在 http://localhost:${port}`);
});