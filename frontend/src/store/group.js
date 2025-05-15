import { defineStore } from "pinia";
import {
    getGroups,
    getGroup,
    createGroup,
    updateGroup,
    deleteGroup,
} from "../api/group";

export const useGroupStore = defineStore("group", {
    state: () => ({
        groups: [],
        currentGroup: null,
        loading: false,
        error: null,
    }),

    getters: {
        getGroupById: (state) => (id) => {
            return state.groups.find((group) => group.id === id) || null;
        },
    },

    actions: {
        async fetchGroups() {
            this.loading = true;
            this.error = null;
            try {
                const response = await getGroups();
                this.groups = response.data.sort((a, b) => a.id - b.id);
            } catch (err) {
                this.error = err.message || "获取群组列表失败";
                console.error("获取群组列表错误:", err);
                this.groups = [];
            } finally {
                this.loading = false;
            }
        },

        async fetchGroup(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await getGroup(id);
                this.currentGroup = response.data;
                return this.currentGroup;
            } catch (err) {
                this.error = err.message || "获取群组详情失败";
                console.error("获取群组详情错误:", err);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async createGroup(groupData) {
            this.loading = true;
            this.error = null;
            try {
                const response = await createGroup(groupData);
                this.groups.push(response.data);
                return response.data;
            } catch (err) {
                this.error = err.message || "创建群组失败";
                console.error("创建群组错误:", err);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async updateGroup(id, groupData) {
            this.loading = true;
            this.error = null;
            try {
                const response = await updateGroup(id, groupData);
                const index = this.groups.findIndex((group) => group.id === id);
                if (index !== -1) {
                    this.groups[index] = response.data;
                }
                if (this.currentGroup && this.currentGroup.id === id) {
                    this.currentGroup = response.data;
                }
                return response.data;
            } catch (err) {
                this.error = err.message || "更新群组失败";
                console.error("更新群组错误:", err);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async removeGroup(id) {
            this.loading = true;
            this.error = null;
            try {
                await deleteGroup(id);
                this.groups = this.groups.filter((group) => group.id !== id);
                if (this.currentGroup && this.currentGroup.id === id) {
                    this.currentGroup = null;
                }
                return true;
            } catch (err) {
                this.error = err.message || "删除群组失败";
                console.error("删除群组错误:", err);
                return false;
            } finally {
                this.loading = false;
            }
        },
    },
});
