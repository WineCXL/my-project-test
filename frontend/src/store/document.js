import { defineStore } from "pinia";
import DocumentService from "../api/document";

export const useDocumentStore = defineStore("document", {
    state: () => ({
        userDocuments: [],
        loading: false,
        error: null,
    }),

    actions: {
        async fetchUserDocuments() {
            this.loading = true;
            this.error = null;
            try {
                const response = await DocumentService.getUserDocuments();
                if (response.success && response.data) {
                    this.userDocuments = response.data;
                } else {
                    this.userDocuments = [];
                }
                return this.userDocuments;
            } catch (error) {
                console.error("获取用户文档失败:", error);
                this.error = error.message || "获取用户文档失败";
                this.userDocuments = [];
                return [];
            } finally {
                this.loading = false;
            }
        },

        async generateKeyword() {
            try {
                const response = await DocumentService.generateKeyword();
                if (response.success && response.data && response.data.keyword) {
                    return response.data.keyword;
                }
                return null;
            } catch (error) {
                console.error("生成关键词失败:", error);
                return null;
            }
        },

        async uploadDocument(formData) {
            this.loading = true;
            try {
                const response = await DocumentService.uploadDocument(formData);
                return response;
            } catch (error) {
                console.error("上传文档失败:", error);
                throw error;
            } finally {
                this.loading = false;
            }
        }
    }
});