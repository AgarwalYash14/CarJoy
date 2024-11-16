import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/auth`;

const authApi = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

export const login = async (email, password) => {
    try {
        const response = await authApi.post("/login", { email, password });
        return response.data;
    } catch (error) {
        console.error("Login error:", error.response?.data);
        throw error;
    }
};

export const register = async (email, password) => {
    try {
        const response = await authApi.post("/register", { email, password });
        return response.data;
    } catch (error) {
        console.error("Registration error:", error.response?.data);
        throw error;
    }
};

export const logout = async () => {
    try {
        await authApi.post("/logout");
    } catch (error) {
        console.error("Logout error:", error);
    }
};

export const getCurrentUser = async () => {
    try {
        const response = await authApi.get("/me");
        return response.data;
    } catch (error) {
        console.error("Get current user error:", error);
        throw error;
    }
};
