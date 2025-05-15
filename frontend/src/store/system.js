import { defineStore } from "pinia";
import { getSystemParams, updateSystemParams } from "../api/system";

export const useSystemStore = defineStore("system", {
    state: () => ({
        systemParams: null,
        loading: false,
        error: null,
    }),

    actions: {
        async fetchSystemParams() {
            this.loading = true;
            this.error = null;
            try {
                const response = await getSystemParams();
                this.systemParams = response.data;
            } catch (err) {
                this.error = err.message || "获取系统参数失败";
                console.error("获取系统参数错误:", err);
                // 设置默认系统参数，确保UI可以正常显示
                this.systemParams = {
                    securityParam: "128",
                    updatedAt: new Date().toISOString(),
                };
            } finally {
                this.loading = false;
            }
        },

        async updateSystemParams(params) {
            this.loading = true;
            this.error = null;
            try {
                const response = await updateSystemParams(params);
                this.systemParams = response.data;
                return true;
            } catch (err) {
                this.error = err.message || "更新系统参数失败";
                console.error("更新系统参数错误:", err);
                return false;
            } finally {
                this.loading = false;
            }
        },
    },
});
