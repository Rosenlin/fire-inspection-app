require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// 使用 body-parser 中間件解析 JSON 請求
app.use(bodyParser.json());

// 提供 public 資料夾中的靜態檔案 (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// POST 接口處理點檢表數據
app.post('/send-email', async (req, res) => {
    const { location, inspector, remarks } = req.body;

    // 進行更嚴謹的驗證
    if (!location || !inspector || !Array.isArray(remarks) || remarks.length === 0) {
        return res.status(400).json({ error: '地點、檢查人為必填，備註不可為空。' });
    }

    // 從環境變數讀取郵件配置
    const { GMAIL_USER, GMAIL_PASS, RECIPIENT_EMAIL } = process.env;

    if (!GMAIL_USER || !GMAIL_PASS || !RECIPIENT_EMAIL) {
        console.error('缺少郵件配置環境變數');
        return res.status(500).json({ error: '伺服器郵件配置不完整' });
    }

    try {
        // 配置 Nodemailer 傳輸
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASS
            }
        });

        // 配置郵件內容
        const mailOptions = {
            from: `"消防點檢系統" <${GMAIL_USER}>`,
            to: RECIPIENT_EMAIL,
            subject: '【通知】消防點檢表已提交',
            text: `新的點檢紀錄已提交：\n\n地點: ${location}\n檢查人: ${inspector}\n備註: ${remarks.join(', ')}`
        };

        // 發送郵件
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: '郵件已成功發送' });
    } catch (error) {
        console.error('郵件發送失敗:', error);
        res.status(500).json({ error: '郵件發送失敗' });
    }
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`伺服器運行在 http://localhost:${PORT}`);
});