const { getChannelIds } = require('../functions/getChannelIds.js');
const { download } = require('../functions/download.js');
const { compareJson } = require('../functions/compareJson');
const { getChannelSettings } = require('../functions/database.js');
const moment = require('moment');
const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference"; // ✅ 建議改用這個 endpoint
const model = "openai/gpt-4.1";

const clientAI = new OpenAI({
  baseURL: endpoint,
  apiKey: token,
});

// === AI 產生公告文字 ===
async function generateAnnouncement(imageUrl, date) {
  try {
    const response = await clientAI.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `你是一位音樂節奏遊戲的官方公告編輯助理。  
任務：
1. 從使用者提供的圖片中擷取所有可見資訊，例如：
   - 新區域名稱
   - 新樂曲或挑戰曲目
   - 新譜面名稱
   - 收集道具或獎勵（**僅限新道具、新物品，不包含固定存在的蒐藏品，例如ネームプレート、フレーム等**）
   - 新功能系統
   - 其他新增內容
2. 根據提取到的資訊生成完整公告文字。  
3. 公告格式及風格：
   - 第一段簡單介紹新區域、新曲目和更新時間，不使用 “🔶新區域公告” 等標籤，格式為 "【{日期}({星期})「xxxx」{活動內容}！】"
   - 後續段落使用 emoji 標記開頭：
     - 🔷挑戰樂曲公告  
     - 🔶提醒事項  
     - 🔷新增譜面公告  
     - 🔶新功能公告  
     - 🔷其他新內容  
   - 保持活潑、輕鬆的日系手遊官方公告風格。  
4. 嚴格規則：
   - **只有圖片中出現的新資訊才加入公告**，缺少的段落或資訊就直接省略，不要編造。  
   - **固定存在的收藏品（如ネームプレート、フレーム）絕對不要出現在公告中**。  
   - 不要加入結尾祝福。
   - 如果文字看不清楚請不要擅自添加其餘訊息
   - 只要是歌曲，必須在前面加上「🎵」符號，並另作格式，一行一首歌
   - 第一行的簡單介紹內，星期不要有星期兩字
   - 日期格式為 MM/DD
   - xxxx為區域名稱或是樂曲類型，如：niconico＆ボーカロイド，POPS＆アニメ等。並且忽略上面所寫的International ver.，
   - xxxx的樂曲類型包含但不限於：POPS＆アニメ, niconico＆ボーカロイド, 東方Project, ゲーム＆バラエティ, オンゲキ＆CHUNITHM 等，可能要透過歌曲名稱判斷
   - xxxx如果是特定作品的連動，請使用該作品名稱，如：ラブライブ！, プリキュア 等
   - 挑戰樂曲僅只限於有出現PREFECT CHALLENGE的樂曲，沒有出現的話就不要加入這個段落
5. 相關詞彙，如有出現類似詞彙請使用下列詞彙：
   - CHUNITHM
   - 中二企鵝`
        },
        {
          role: "user",
          content: [
            { type: "text", text: `更新時間： ${date}
                請根據這張活動圖片內容生成公告：` },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      temperature: 0.8,
      top_p: 1.0,
    });

    return response.choices[0].message.content || "（AI 未能生成公告）";
  } catch (err) {
    console.error("[AI Error]", err);
    return "（公告生成失敗）";
  }
}

// === 發送圖片 + 公告到 Discord ===
async function postImageToDiscord(imageUrl, item, channelId, client, date) {
  console.log(channelId);
  const avatarUrl = "https://www.google.com/s2/favicons?sz=64&domain=maimai.sega.com";

  // 呼叫 AI 生成公告
  const announcement = await generateAnnouncement(imageUrl, date);

  const embedMessage = {
    content: announcement, // 🆕 把 AI 公告放到訊息正文
    embeds: [
      {
        title: item.title,
        color: 4571344,
        image: { url: imageUrl },
        author: { name: 'maimai でらっくす', icon_url: avatarUrl },
        footer: { text: `Generated at ${moment().format('YYYY-MM-DD')}` },
        thumbnail: { url: 'https://maimai.sega.com/assets/img/prism/common/logo.png' },
      },
    ],
    username: 'maimai でらっくす',
    avatar_url: avatarUrl,
  };

  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    console.error(`Channel with ID ${channelId} not found.`);
    return;
  }

  channel.send(embedMessage).then(() => {
    console.log(`Message sent to channel ID ${channelId}`);
  }).catch(console.error);
}

// === 原本流程 ===
async function LoadImages(channelIds, client) {
  try {
    if (!fs.existsSync('./json/maiintl/newObjects.json')) {
      console.log('[INFO] newObjects.json not found, skipping!');
      return;
    }
    const data = JSON.parse(fs.readFileSync('./json/maiintl/newObjects.json'));
    const imageFolder = 'images';
    fs.mkdirSync(imageFolder, { recursive: true });
    for (const item of data) {
      if (item.date[1] < 10) item.date[1] = '0' + item.date[1];
      if (item.date[2] < 10) item.date[2] = '0' + item.date[2];
      const date = item.date.join('-');
      const imageUrl = `https://maimai.sega.com/assets/img/download/pop/download/${date}/pop.jpg`;

      console.log(`Downloading image from: ${imageUrl}`);
      await axios.get(imageUrl, { responseType: 'arraybuffer' });
      console.log(`Downloaded: ${imageUrl}`);

      for (const channelId of channelIds) {
        try {
          const settings = await getChannelSettings(channelId);
          if (settings && settings.Maimaiintl) {
            await postImageToDiscord(imageUrl, item, channelId, client, date);
          }
        } catch (err) {
          console.error('Error fetching channel settings:', err);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function maiintl(client) {
  await download('maiintl', 'https://maimai.sega.com/assets/data/index.json');
  await compareJson('maiintl');
  const channelIds = await getChannelIds();
  console.log(channelIds);
  if (channelIds.length === 0) {
    console.error('No channels found in the database.');
    return;
  }
  await LoadImages(channelIds, client);
}

module.exports = {
  maiintl: maiintl
};
