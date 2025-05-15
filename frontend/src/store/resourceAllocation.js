import { defineStore } from "pinia";
import ResourceAllocationService from "../api/resourceAllocation";

export const useResourceAllocationStore = defineStore("resourceAllocation", {
    state: () => ({
        allocations: [],
        currentAllocation: null,
        loading: false,
        error: null,
    }),

    getters: {
        getAllocationById: (state) => (id) => {
            return (
                state.allocations.find((allocation) => allocation.id === id) ||
                null
            );
        },
    },

    actions: {
        async fetchAllocations() {
            this.loading = true;
            this.error = null;
            try {
                const response = await ResourceAllocationService.getAll();
                this.allocations = response.data;
            } catch (err) {
                this.error = err.message || "获取资源分配列表失败";
                console.error("获取资源分配列表错误:", err);
                this.allocations = [];
            } finally {
                this.loading = false;
            }
        },

        async fetchAllocation(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await ResourceAllocationService.get(id);
                this.currentAllocation = response.data;
                return this.currentAllocation;
            } catch (err) {
                this.error = err.message || "获取资源分配详情失败";
                console.error("获取资源分配详情错误:", err);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async createResourceAllocation(allocationData) {
            this.loading = true;
            this.error = null;
            try {
                const response = await ResourceAllocationService.create(
                    allocationData
                );
                this.allocations.push(response.data);
                return response.data;
            } catch (err) {
                this.error = err.message || "创建资源分配失败";
                console.error("创建资源分配错误:", err);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async verifyResourceAllocation(allocationId) {
            this.loading = true;
            this.error = null;
            try {
                const response =
                    await ResourceAllocationService.verifyAllocation(
                        allocationId
                    );
                return response.data;
            } catch (err) {
                this.error = err.message || "验证资源分配失败";
                console.error("验证资源分配错误:", err);
                return null;
            } finally {
                this.loading = false;
            }
        },
    },
});
