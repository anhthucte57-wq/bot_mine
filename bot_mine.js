const mineflayer = require('mineflayer');
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ==========================================
// CẤU HÌNH CỦA BẠN (SỬA ĐÚNG 3 CHỖ NÀY)
// ==========================================
const SERVER_HOST = 'play.kingmc.vn'; 
const SERVER_PORT = 25565;

// 1. TÊN ACC MINECRAFT CỦA BẠN
const BOT_USERNAME = 'pumtrummod'; 
// 2. MẬT KHẨU ACC MINECRAFT CỦA BẠN
const PASSWORD = 'manhne11'; 

// 3. IP CỦA HOST CLOUDCODE (Nơi chạy Bot Discord)
// Bạn phải thay dòng này bằng IP thật (VD: http://103.145.10.20:24950/api/game_payment)
const DISCORD_API_URL = "ord-804768-2261.cldcode.host:24950";

const BOT_VERSION = false; 

let globalBot = null; 
let isInMainServer = false;
let joinAttempt = 0; 
let hasLoggedIn = false; 

function startBot() {
  joinAttempt++;
  hasLoggedIn = false; 
  console.log(`\n🔄 [LẦN ${joinAttempt}] Đang kết nối vào server...`);
  
  const bot = mineflayer.createBot({
    host: SERVER_HOST, 
    port: SERVER_PORT, 
    username: BOT_USERNAME, 
    version: BOT_VERSION, 
    hideErrors: true, 
    checkTimeoutInterval: 120000
  });
  
  globalBot = bot; 

  bot.on('error', (err) => { 
    if (err.code !== 'ECONNRESET') console.log(`[LỖI] ${err.message}`); 
  });

  bot.on('spawn', () => {
    console.log(`✅ [LẦN ${joinAttempt}] Đã vào sảnh chờ!`);
    if (joinAttempt === 1) {
      console.log(`⏳ [CHỐNG BOT] Tự động out sau 3 giây...`);
      setTimeout(() => { bot.quit(); }, 3000); 
    } else {
      if (hasLoggedIn) return; 
      hasLoggedIn = true;
      setTimeout(() => { 
        console.log(`[AUTH] Đang gửi lệnh đăng nhập...`);
        bot.chat(`/dn ${PASSWORD}`); 
      }, 2000);
      setTimeout(() => { 
        if (!isInMainServer) {
          console.log(`[GUI] Đang chọn ô đồng hồ (ô thứ 5) để mở Menu...`);
          bot.setQuickBarSlot(4); 
          bot.activateItem(); 
        }
      }, 6000);
    }
  });

  bot.on('windowOpen', (window) => {
    let titleStr = "";
    try {
      if (typeof window.title === 'string') titleStr = window.title;
      else titleStr = JSON.stringify(window.title);
    } catch (e) { titleStr = "Unknown"; }
    console.log(`[GUI] Đã mở bảng: ${titleStr}`);
    if (!isInMainServer) {
      setTimeout(() => { 
        console.log(`[GUI] Đang click ô 25 để vào KingSMP...`);
        bot.clickWindow(24, 0, 0); 
        isInMainServer = true; 
      }, 1000);
    }
  });

  bot.on('message', async (jsonMsg) => {
    const msg = jsonMsg.toString();
    if (msg.includes("Bạn nhận được") && msg.includes("từ")) {
        console.log(`[TIỀN VÀO] ${msg}`);
        try { 
            await axios.post(DISCORD_API_URL, { message: msg }); 
            console.log(`[API] Đã gửi thông tin về Discord thành công.`);
        } catch (error) { 
            console.log(`❌ [API LỖI] ${error.message}`); 
        }
    }
  });

  bot.on('end', (reason) => {
    console.log(`❌ Bot ngắt kết nối. Lý do: ${reason}`);
    if (joinAttempt === 1 || !isInMainServer) {
      console.log(`🔄 Thử kết nối lại sau 3 giây...`);
      setTimeout(startBot, 3000); 
    }
  });
  setInterval(() => { 
    if (isInMainServer && bot.entity) { 
      bot.setControlState('jump', true); 
      setTimeout(() => bot.setControlState('jump', false), 500); 
    } 
  }, 30000);
}

startBot();

app.post('/pay', (req, res) => {
  const { ign, amount } = req.body;
  if (!isInMainServer || !globalBot) return res.status(400).send({ status: 'error', message: 'Bot chưa vào server' });
  globalBot.chat(`/pay ${ign} ${amount}`);
  console.log(`[PAY] Đã gõ lệnh: /pay ${ign} ${amount}`);
  res.send({ status: 'success' });
});

app.listen(process.env.PORT || 3000, () => { 
  console.log('🌐 API Bot Mine đang chạy ở cổng 3000'); 
});
