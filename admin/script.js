// Supabase配置 - 用户需替换为自己的Supabase信息
const SUPABASE_URL = 'https://zgbvcuyquvfljthljvdb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYnZjdXlxdXZmbGp0aGxqdmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMDMyMTIsImV4cCI6MjA2Nzg3OTIxMn0.S_ZTY4Zc23yCPPMIQG2_l3Jcsk5nvPquZlzw-JlS0oY';

// 初始化Supabase客户端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM元素
const loginPage = document.getElementById('loginPage');
const adminPage = document.getElementById('adminPage');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const prizeList = document.getElementById('prizeList');
const prizeModal = document.getElementById('prizeModal');
const modalTitle = document.getElementById('modalTitle');
const prizeForm = document.getElementById('prizeForm');
const prizeIdInput = document.getElementById('prizeId');
const prizeNameInput = document.getElementById('prizeName');
const prizeImageInput = document.getElementById('prizeImage');
const prizeProbabilityInput = document.getElementById('prizeProbability');
const closeBtn = document.querySelector('.close-btn');
const accessLogTable = document.getElementById('accessLogTable').querySelector('tbody');
const lotteryRecordTable = document.getElementById('lotteryRecordTable').querySelector('tbody');

// 全局变量
let map;
let currentPrizeId = null;

// 页面加载时检查登录状态
window.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn) {
        showAdminPage();
    }
});

// 登录功能
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // 简单验证（实际项目中应使用更安全的验证方式）
    if (username === 'admin' && password === 'admin') {
        localStorage.setItem('adminLoggedIn', 'true');
        showAdminPage();
    } else {
        loginError.textContent = '用户名或密码错误';
        loginError.style.display = 'block';
    }
});

// 退出登录
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    loginPage.style.display = 'flex';
    adminPage.style.display = 'none';
});

// 显示管理页面并加载数据
function showAdminPage() {
    loginPage.style.display = 'none';
    adminPage.style.display = 'block';
    loadPrizes();
    loadAccessLogs();
    loadLotteryRecords();
    initMap();
}

// 导航切换
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // 更新导航激活状态
        navLinks.forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');

        // 显示对应的内容区域
        const targetId = e.target.getAttribute('href').substring(1);
        contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetId) {
                section.classList.add('active');
            }
        });
    });
});

// 加载奖品列表
async function loadPrizes() {
    try {
        const { data, error } = await supabase
            .from('prizes')
            .select('*')
            .order('id');

        if (error) throw error;

        prizeList.innerHTML = '';
        data.forEach(prize => {
            const prizeCard = document.createElement('div');
            prizeCard.className = 'prize-card';
            prizeCard.innerHTML = `
                <div class="prize-image" style="background-image: url('${prize.image_url}')"></div>
                <div class="prize-info">
                    <h3>${prize.name}</h3>
                    <p class="prize-probability">中奖概率: ${prize.probability}%</p>
                    <div class="prize-actions">
                        <button class="edit-btn" data-id="${prize.id}">编辑</button>
                        <button class="delete-btn" data-id="${prize.id}">删除</button>
                    </div>
                </div>
            `;
            prizeList.appendChild(prizeCard);
        });

        // 添加编辑和删除事件监听
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editPrize(btn.getAttribute('data-id')));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deletePrize(btn.getAttribute('data-id')));
        });

    } catch (error) {
        console.error('加载奖品失败:', error);
    }
}

// 编辑奖品
async function editPrize(id) {
    try {
        const { data, error } = await supabase
            .from('prizes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        currentPrizeId = id;
        modalTitle.textContent = '编辑奖品';
        prizeIdInput.value = data.id;
        prizeNameInput.value = data.name;
        prizeImageInput.value = data.image_url;
        prizeProbabilityInput.value = data.probability;
        prizeModal.style.display = 'flex';

    } catch (error) {
        console.error('获取奖品详情失败:', error);
    }
}

// 删除奖品
async function deletePrize(id) {
    if (!confirm('确定要删除这个奖品吗？')) return;

    try {
        const { error } = await supabase
            .from('prizes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // 重新加载奖品列表
        loadPrizes();

    } catch (error) {
        console.error('删除奖品失败:', error);
    }
}

// 保存奖品修改
prizeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const prizeData = {
        name: prizeNameInput.value.trim(),
        image_url: prizeImageInput.value.trim(),
        probability: parseInt(prizeProbabilityInput.value),
        updated_at: new Date().toISOString()
    };

    try {
        if (currentPrizeId) {
            // 更新现有奖品
            const { error } = await supabase
                .from('prizes')
                .update(prizeData)
                .eq('id', currentPrizeId);

            if (error) throw error;
        } else {
            // 创建新奖品
            const { error } = await supabase
                .from('prizes')
                .insert([prizeData]);

            if (error) throw error;
        }

        prizeModal.style.display = 'none';
        loadPrizes();
        resetPrizeForm();

    } catch (error) {
        console.error('保存奖品失败:', error);
    }
});

// 重置奖品表单
function resetPrizeForm() {
    currentPrizeId = null;
    prizeForm.reset();
}

// 关闭奖品弹窗
closeBtn.addEventListener('click', () => {
    prizeModal.style.display = 'none';
    resetPrizeForm();
});

// 加载访问日志
async function loadAccessLogs() {
    try {
        const { data, error } = await supabase
            .from('access_logs')
            .select('*')
            .order('access_time', { ascending: false })
            .limit(50);

        if (error) throw error;

        accessLogTable.innerHTML = '';
        data.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(log.access_time).toLocaleString()}</td>
                <td>${log.access_type}</td>
                <td>${log.user_ip}</td>
                <td>${log.address || '未知位置'}</td>
            `;
            accessLogTable.appendChild(row);

            // 在地图上添加标记
            if (log.latitude && log.longitude) {
                addMarkerToMap(log.latitude, log.longitude, log.user_ip);
            }
        });

    } catch (error) {
        console.error('加载访问日志失败:', error);
    }
}

// 加载抽奖记录
async function loadLotteryRecords() {
    try {
        const { data, error } = await supabase
            .from('lottery_records')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        lotteryRecordTable.innerHTML = '';
        data.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(record.created_at).toLocaleString()}</td>
                <td>${record.prize_name}</td>
                <td>${record.user_ip}</td>
                <td>${record.address || '未知位置'}</td>
            `;
            lotteryRecordTable.appendChild(row);
        });

    } catch (error) {
        console.error('加载抽奖记录失败:', error);
    }
}

// 初始化地图
function initMap() {
    // 默认定位到曼谷
    map = L.map('map').setView([13.7563, 100.5018], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// 添加标记到地图
function addMarkerToMap(lat, lng, ip) {
    L.marker([lat, lng]).addTo(map)
        .bindPopup(`<b>IP: ${ip}</b>`)
        .openPopup();
}