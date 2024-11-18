import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const userData = await authApi.getCurrentUser();
                setUser(userData);
                setIsAuthenticated(true);
            } catch {
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const login = async (email, password) => {
        try {
            const { user } = await authApi.login(email, password);
            setUser(user);
            setIsAuthenticated(true);
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
            throw error;
        }
    };

    const register = async (email, password) => {
        try {
            const { user } = await authApi.register(email, password);
            setUser(user);
            setIsAuthenticated(true);
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
            throw error;
        }
    };

    const logout = async () => {
        await authApi.logout();
        setUser(null);
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
    };

    return (
        <AuthContext.Provider
            value={{ isAuthenticated, user, loading, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
