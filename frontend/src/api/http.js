import axios from "axios";
import { ElMessage } from "element-plus";

// 创建axios实例
const http = axios.create({
    baseURL: "http://localhost:3000/api", // 确保此处的端口号与后端一致
    timeout: 60000, // 增加请求超时时间到60秒
    headers: {
        "Content-Type": "application/json",
    },
});

// 请求拦截器
http.interceptors.request.use(
    (config) => {
        // 在发送请求之前做些什么
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // 对请求错误做些什么
        return Promise.reject(error);
    }
);

// 响应拦截器
http.interceptors.response.use(
    (response) => {
        // 对响应数据做点什么
        const res = response.data;

        // 如果返回的状态码不是200或201，说明出错了，需要处理错误
        if (response.status !== 200 && response.status !== 201) {
            ElMessage({
                message: res.message || "错误",
                type: "error",
                duration: 5 * 1000,
            });

            return Promise.reject(new Error(res.message || "错误"));
        } else {
            return res;
        }
    },
    (error) => {
        // 对响应错误做点什么
        console.error("请求错误:", error);

        // 处理401错误（未授权）
        if (error.response && error.response.status === 401) {
            // 清除token和用户信息
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("user");

            // 重定向到登录页
            window.location.href = "/#/auth/login";

            // 显示未授权消息
            ElMessage({
                message: "登录已过期，请重新登录",
                type: "warning",
                duration: 5 * 1000,
            });
        }
        // 不再自动显示错误消息，让组件自己处理

        // 确保错误对象中包含后端返回的错误信息
        if (error.response && error.response.data) {
            error.message = error.response.data.message || error.message;
        }

        return Promise.reject(error);
    }
);

export default http;
