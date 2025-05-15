module.exports = {
    secret: process.env.JWT_SECRET || "miracl-secure-secret-key-for-jwt",
    // token过期时间（以秒为单位）
    jwtExpiration: 3600, // 1小时
    jwtRefreshExpiration: 86400, // 24小时
};
