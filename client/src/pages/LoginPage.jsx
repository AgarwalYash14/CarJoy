import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { HourglassSimple } from "@phosphor-icons/react";
import useAuth from "../hooks/useAuth";

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await login(formData.email, formData.password);
            navigate("/", { replace: true });
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    error.message ||
                    "Invalid email or password"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gradient-to-br from-violet-800 to-violet-950 rounded-2xl p-8 shadow-lg">
                <div className="flex flex-col items-center mb-8">
                    <HourglassSimple size={50} color="#6D28D9" weight="fill" />
                    <h1 className="text-2xl font-bold mt-4">Welcome Back</h1>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-transparent border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-transparent border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-violet-600 text-white py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="mt-4 text-center ">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-violet-600 hover:text-violet-700"
                    >
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
