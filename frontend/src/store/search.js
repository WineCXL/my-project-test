import { defineStore } from "pinia";
import { performSearch, getSearchHistory } from "../api/search";

export const useSearchStore = defineStore("search", {
    state: () => ({
        searchResults: null,
        searchHistory: [],
        loading: false,
        error: null,
    }),

    actions: {
        async search(searchParams) {
            this.loading = true;
            this.error = null;
            this.searchResults = null;
            try {
                const response = await performSearch(searchParams);
                this.searchResults = response.data;
                return this.searchResults;
            } catch (err) {
                this.error = err.message || "执行搜索操作失败";
                console.error("执行搜索操作错误:", err);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchSearchHistory() {
            this.loading = true;
            this.error = null;
            try {
                const response = await getSearchHistory();
                this.searchHistory = response.data;
                return this.searchHistory;
            } catch (err) {
                this.error = err.message || "获取搜索历史失败";
                console.error("获取搜索历史错误:", err);
                return [];
            } finally {
                this.loading = false;
            }
        },

        clearSearchResults() {
            this.searchResults = null;
        },
    },
});
