import { defineStore } from "pinia";
import {
    getNodes,
    getNode,
    createNode,
    updateNode,
    deleteNode,
} from "../api/node";
import axios from "axios";

export const useNodeStore = defineStore("node", {
    state: () => ({
        nodes: [],
        currentNode: null,
        loading: false,
        error: null,
    }),

    getters: {
        getNodeById: (state) => (id) => {
            return state.nodes.find((node) => node.id === id) || null;
        },
    },

    actions: {
        async fetchNodes() {
            this.loading = true;
            this.error = null;
            try {
                const response = await getNodes();
                // 防止数据为null或undefined
                const nodeData = response.data || [];
                // 确保按ID数字排序，使用try-catch避免排序错误
                try {
                    this.nodes = nodeData.sort((a, b) => {
                        // 确保a.id和b.id是数字
                        const idA = parseInt(a.id, 10);
                        const idB = parseInt(b.id, 10);
                        // 如果转换失败则使用原始值进行比较
                        return isNaN(idA) || isNaN(idB)
                            ? String(a.id).localeCompare(String(b.id))
                            : idA - idB;
                    });
                } catch (sortError) {
                    console.warn("节点排序失败，使用原始顺序", sortError);
                    this.nodes = nodeData;
                }
                return this.nodes;
            } catch (error) {
                this.error = error.message || "获取节点失败";
                console.error("获取节点失败:", error);
                // 不抛出错误，返回空数组以防止页面崩溃
                this.nodes = [];
                return this.nodes;
            } finally {
                this.loading = false;
            }
        },

        async createNode(nodeData) {
            this.loading = true;
            this.error = null;
            try {
                const response = await createNode(nodeData);
                this.nodes.push(response.data);
                return response.data;
            } catch (err) {
                this.error = err.message || "创建节点失败";
                console.error("创建节点错误:", err);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async updateNode(id, nodeData) {
            this.loading = true;
            this.error = null;
            try {
                const response = await updateNode(id, nodeData);
                const index = this.nodes.findIndex((node) => node.id === id);
                if (index !== -1) {
                    this.nodes[index] = response.data;
                }
                if (this.currentNode && this.currentNode.id === id) {
                    this.currentNode = response.data;
                }
                return response.data;
            } catch (err) {
                this.error = err.message || "更新节点失败";
                console.error("更新节点错误:", err);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async removeNode(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await deleteNode(id);

                // 检查响应是否成功
                if (!response.success) {
                    throw new Error(response.message || "删除节点失败");
                }

                // 更新节点列表
                this.nodes = this.nodes.filter((node) => node.id !== id);
                if (this.currentNode && this.currentNode.id === id) {
                    this.currentNode = null;
                }
                return true;
            } catch (err) {
                this.error = err.message || "删除节点失败";
                console.error("删除节点错误:", err);
                throw err; // 重新抛出错误，让组件能够捕获它
            } finally {
                this.loading = false;
            }
        },
    },
});
