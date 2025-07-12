// Supabase配置 - 从环境变量获取
const SUPABASE_URL = 'https://zgbvcuyquvfljthljvdb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYnZjdXlxdXZmbGp0aGxqdmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMDMyMTIsImV4cCI6MjA2Nzg3OTIxMn0.S_ZTY4Zc23yCPPMIQG2_l3Jcsk5nvPquZlzw-JlS0oY';

// 初始化Supabase客户端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 奖品配置 - 将从Supabase动态加载
let prizes = [];

// DOM元素
const wheel = document.getElementById('wheel');
const startBtn = document.getElementById('startBtn');
const resultModal = document.getElementById('resultModal');
const resultImage = document.getElementById('resultImage');
const resultName = document.getElementById('resultName');
const confirmBtn = document.getElementById('confirmBtn');
const closeBtn = document.querySelector('.close-btn');
const historyList = document.getElementById('historyList');
const claimModal = document.getElementById('claimModal');
const closeClaimBtn = document.querySelector('.close-claim-btn');

// 从Supabase获取奖品配置
async function fetchPrizes() {
    try {
        const { data, error } = await supabase
            .from('prizes')
            .select('*')
            .order('id');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('获取奖品配置失败:', error);
        // 使用默认奖品配置作为 fallback
        return [
            { name: '一等奖：10元红包', image_url: 'https://i.postimg.cc/C1b4fnZ4/prize1.png', probability: 5 },
            { name: '二等奖：雪王自选', image_url: 'https://i.postimg.cc/bYHTybfy/prize3.png', probability: 10 },
            { name: '三等奖：5元红包', image_url: 'https://i.postimg.cc/3wsBRFwR/prize2.png', probability: 15 },
            { name: '四等奖：柠檬水一杯', image_url: 'https://i.postimg.cc/TwHTg1Zp/prize4.png', probability: 20 },
            { name: '五等奖：谢谢惠顾', image_url: 'https://i.postimg.cc/QM9mhyhw/hanks.png', probability: 50 }
        ];
    }
}

// 提交抽奖结果到Supabase
async function submitLotteryResult(prize) {
    try {
        // 获取地理位置信息
        const geoResponse = await fetch('/api/geolocation', { method: 'GET' });
        const geoData = await geoResponse.json();

        const response = await fetch('/api/lottery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prizeName: prize.name,
                prizeImage: prize.image_url,
                ...geoData
            })
        });
        return await response.json();
    } catch (error) {
        console.error('提交抽奖结果失败:', error);
        return { success: false, error: '提交抽奖结果失败' };
    }
}

// 初始化转盘
function initWheel() {
    const sliceAngle = 360 / prizes.length;
    wheel.innerHTML = '';

    prizes.forEach((prize, index) => {
        const slice = document.createElement('div');
        const angle = index * sliceAngle;
        slice.style.transform = `rotate(${angle}deg) skewY(${90 - sliceAngle}deg)`;
        slice.style.backgroundColor = getRandomColor(index);
        slice.style.color = '#fff';
        slice.innerHTML = `<span style="transform: skewY(${sliceAngle - 90}deg) rotate(${sliceAngle / 2}deg); display: block; padding: 20px 10px;">${prize.name}</span>`;
        wheel.appendChild(slice);
    });
}

// 生成随机颜色
function getRandomColor(index) {
    const colors = ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557'];
    return colors[index % colors.length];
}

// 计算奖品概率
function getRandomPrize() {
    const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    let random = Math.random() * totalProbability;
    for (const prize of prizes) {
        random -= prize.probability;
        if (random <= 0) {
            return prize;
        }
    }
    return prizes[prizes.length - 1];
}

// 旋转转盘
function rotateWheel(prizeIndex) {
    const sliceAngle = 360 / prizes.length;
    const baseRotation = 360 * 5;
    const targetRotation = baseRotation + (360 - (prizeIndex * sliceAngle + sliceAngle / 2));

    wheel.style.transform = `rotate(${targetRotation}deg)`;
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, 5000);
    });
}

// 显示结果弹窗
function showResultModal(prize) {
    resultImage.src = prize.image;
    resultName.textContent = prize.name;
    resultModal.style.display = 'flex';
}

// 添加抽奖记录
function addHistoryRecord(prize) {
    const now = new Date();
    const timeStr = now.toLocaleString();
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <img src="${prize.image}" alt="${prize.name}">
        <div class="info">
            <p>${timeStr}</p>
            <p>${prize.name}</p>
        </div>
        <button class="claim-btn" data-name="${prize.name}" data-image="${prize.image}">领取</button>
    `;
