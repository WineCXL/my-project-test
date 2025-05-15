import http from "./http";

// 执行搜索操作
export function performSearch(data) {
    return http.post("/search", data);
}

/*
// 获取搜索历史
export function getSearchHistory() {
    return http.get("/search/history");
}

// 获取单个搜索记录详情
export function getSearchDetail(id) {
    return http.get(`/search/${id}`);
}

// 删除搜索记录
export function deleteSearchRecord(id) {
    return http.delete(`/search/${id}`);
}
*/
