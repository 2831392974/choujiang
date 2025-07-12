const axios = require('axios');

// 高德API配置 - 用户已提供的API Key
const AMAP_API_KEY = process.env.AMAP_API_KEY || 'a782496f31fd0c379b1c941387e96f07';

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
        // 调用高德IP定位API
        const response = await axios.get(
            `https://restapi.amap.com/v3/ip?ip=${ip}&key=${AMAP_API_KEY}`
        );

        if (response.data.status === '1') {
            return {
                province: response.data.province,
                city: response.data.city,
                district: response.data.district,
                ip: ip,
                address: `${response.data.province}${response.data.city}${response.data.district}`
            };
        } else {
            console.error('高德IP定位失败:', response.data.info);
            return { address: '未知位置', ip };
        }
    } catch (error) {
        console.error('IP定位请求失败:', error);
        return { address: '定位失败', ip };
    }
}

// 获取精确经纬度（需要前端配合，但用户要求无授权弹窗，这里使用IP定位的近似坐标）
async function getPreciseLocation(address) {
    try {
        // 调用高德地理编码API获取经纬度
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
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        // 获取用户IP
        const ip = getUserIP(req);
        console.log('用户IP:', ip);

        // 获取地理位置
        const location = await getLocationByIP(ip);

        // 获取经纬度
        let coordinates = null;
        if (location.address !== '未知位置') {
            coordinates = await getPreciseLocation(location.address);
        }

        // 整合结果
        const result = {
            ip: location.ip,
            address: location.address,
            ...coordinates
        };

        // 记录访问日志到Supabase
        if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_KEY
            );

            await supabase.from('access_logs').insert([{
                access_type: 'frontend_visit',
                user_ip: location.ip,
                latitude: coordinates?.latitude || null,
                longitude: coordinates?.longitude || null,
                address: location.address
            }]);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('地理位置API错误:', error);
        res.status(500).json({ error: '获取地理位置失败' });
    }
};