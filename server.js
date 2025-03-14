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
const defaultLogFilePath = './test_data/attack.json';
const defaultAiRole = '你是一個資安分析攻擊的專家，幫我分析這些Log，順便整理歸納LOG內的資料，並簡單說明有發生的資安事件，用中文回答我。';

// 新增的分析端點：處理日誌檔案並發送到外部 API
app.post('/api/analyze-logs', async (req, res) => {
    try {
        // 從請求中獲取檔案路徑，預設為 attack.json
        const filePath = req.body.filePath || defaultLogFilePath;
        const aiRole = req.body.aiRole || defaultAiRole;

        // 讀取並處理檔案內容
        const fileContent = await fs.readFile(filePath, 'utf8');
        const lines = fileContent.split('\n').slice(0, 100);
        const processedContent = lines
            .map(line => line.replace(/\r/g, '').replace(/"/g, '\\"'))
            .join('\n');

        // 發送內容到外部 API
        const response = await axios.post('http://localhost:11434/api/chat', {
            model: 'llama3.2:1b',
            messages: [
                {
                    role: 'system',
                    content: `'${aiRole}'`
                },
                {
                    role: 'user',
                    content: `'${processedContent}'`
                }
            ],
            stream: false
        });

        // 回傳外部 API 的回應
        res.status(200).json({
            message: '日誌分析完成',
            analysis: response.data
        });
    } catch (error) {
        res.status(500).json({ message: '分析失敗', error: error.message });
    }
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`API Server 運行在 http://localhost:${port}`);
});