export const API_BASE_URL =
  "https://leave-management-staging.conceptrecall.com/api";

// export const API_BASE_URL = 'http://localhost:3000/api'

export const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
