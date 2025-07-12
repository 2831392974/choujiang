const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// 初始化Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 高德API Key
const AMAP_API_KEY = process.env.AMAP_API_KEY;

// 获取用户IP地址
function getUserIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           req.connection.socket.remoteAddress;
}

// 通过IP获取地理位置
async function getLocationByIP(ip) {
    try {
        const response = await axios.get(
            `https://restapi.amap.com/v3/ip?ip=${ip}&key=${AMAP_API_KEY}`
        );

        if (response.data.status === '1') {
            return {
                province: response.data.province,
                city: response.data.city,
                district: response.data.district,
                address: `${response.data.province}${response.data.city}${response.data.district}`
            };
        } else {
            console.error('高德IP定位失败:', response.data.info);
            return { address: '未知位置' };
        }
    } catch (error) {
        console.error('IP定位请求失败:', error);
        return { address: '定位失败' };
    }
}

// 获取精确经纬度
async function getPreciseLocation(address) {
    try {
        const response = await axios.get(
            `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&key=${AMAP_API_KEY}`
        );

        if (response.data.status === '1' && response.data.geocodes.length > 0) {
            const location = response.data.geocodes[0].location.split(',');
            return {
                longitude: parseFloat(location[0]),
                latitude: parseFloat(location[1])
            };
        } else {
            console.error('高德地理编码失败:', response.data.info);
            return null;
        }
    } catch (error) {
        console.error('地理编码请求失败:', error);
        return null;
    }
}

// Vercel API处理函数
module.exports = async (req, res) => {
    try {
        // 设置CORS头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // 处理OPTIONS请求
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // 获取请求数据
        const { prizeName, prizeImage } = req.body;
        if (!prizeName || !prizeImage) {
            return res.status(400).json({ error: '缺少奖品信息' });
        }

        // 获取用户IP
        const userIp = getUserIP(req);

        // 获取地理位置
        const location = await getLocationByIP(userIp);
        let coordinates = null;
        if (location.address && location.address !== '未知位置' && location.address !== '定位失败') {
            coordinates = await getPreciseLocation(location.address);
        }

        // 保存抽奖记录到数据库
        const { data, error } = await supabase.from('lottery_records').insert([{
            prize_name: prizeName,
            prize_image: prizeImage,
            user_ip: userIp,
            latitude: coordinates?.latitude || null,
            longitude: coordinates?.longitude || null,
            address: location.address
        }]).select();

        if (error) throw error;

        res.status(200).json({
            success: true,
            record: data[0]
        });
    } catch (error) {
        console.error('抽奖记录API错误:', error);
        res.status(500).json({ error: '保存抽奖记录失败' });
    }
};