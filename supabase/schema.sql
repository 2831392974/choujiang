-- 创建抽奖记录表
CREATE TABLE lottery_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    prize_name TEXT NOT NULL,
    prize_image TEXT NOT NULL,
    user_ip TEXT NOT NULL,
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    address TEXT
);

-- 创建奖品配置表
CREATE TABLE prizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    probability INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初始化奖品数据
INSERT INTO prizes (name, image_url, probability) VALUES
('一等奖：10元红包', 'https://i.postimg.cc/C1b4fnZ4/prize1.png', 5),
('二等奖：雪王自选', 'https://i.postimg.cc/bYHTybfy/prize3.png', 10),
('三等奖：5元红包', 'https://i.postimg.cc/3wsBRFwR/prize2.png', 15),
('四等奖：柠檬水一杯', 'https://i.postimg.cc/TwHTg1Zp/prize4.png', 20),
('五等奖：谢谢惠顾', 'https://i.postimg.cc/QM9mhyhw/hanks.png', 50);

-- 创建访问日志表
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_type TEXT NOT NULL,
    user_ip TEXT NOT NULL,
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    address TEXT
);