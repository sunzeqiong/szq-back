"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promise_1 = __importDefault(require("mysql2/promise"));
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
// 数据库连接配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 123456,
    database: 'note',
    port: 3306
};
// 创建数据库连接池
const pool = promise_1.default.createPool(Object.assign(Object.assign({}, dbConfig), { password: String(dbConfig.password) }));
// 检查数据库连接
function checkDatabaseConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const connection = yield pool.getConnection();
            console.log('数据库连接成功');
            connection.release();
            return true;
        }
        catch (error) {
            console.error('数据库连接失败:', error);
            return false;
        }
    });
}
app.get('/', (req, res) => {
    console.log('收到根路径请求');
    res.send('欢迎来到我的 TypeScript 后端服务!');
});
app.get('/api/user', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('收到 /api/user 请求');
    try {
        console.log('尝试从数据库获取用户数据');
        const [rows] = yield pool.query('SELECT * FROM `user`');
        console.log('查询结果:', rows);
        res.json(rows);
    }
    catch (error) {
        console.error('获取用户数据时发生错误:', error);
        res.status(500).json({ error: '获取用户数据时发生错误', details: error.message });
    }
}));
// 添加一个测试路由
app.get('/api/test', (req, res) => {
    console.log('收到 /api/test 请求');
    res.json({ message: 'Test route is working' });
});
// 将错误处理中间件移到这里，并添加日志
app.use((req, res) => {
    console.log(`收到未匹配的请求: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Not Found' });
});
// 修改服务器启动逻辑
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`服务器正在尝试启动...`);
    try {
        const dbConnected = yield checkDatabaseConnection();
        if (dbConnected) {
            console.log(`服务器成功启动，运行在 http://localhost:${port}`);
        }
        else {
            console.log(`服务器启动，但数据库连接失败。运行在 http://localhost:${port}`);
        }
    }
    catch (error) {
        console.error('服务器启动过程中发生错误:', error);
    }
}));
