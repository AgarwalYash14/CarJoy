import axios from "axios";

const carAPI = {
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/cars`,

    async createCar(carData) {
        try {
            const response = await axios.post(this.baseURL, carData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async getAllCars() {
        try {
            const response = await axios.get(this.baseURL, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async getCarById(id) {
        try {
            const response = await axios.get(`${this.baseURL}/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async updateCar(id, carData) {
        try {
            // Validate required fields before sending
            if (
                !carData.get("title")?.trim() ||
                !carData.get("description")?.trim()
            ) {
                throw new Error("Title and description are required fields");
            }

            const response = await axios.put(`${this.baseURL}/${id}`, carData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async deleteCar(id) {
        try {
            const response = await axios.delete(`${this.baseURL}/${id}`, {
                withCredentials: true,
            });

            if (response.status === 200) {
                return { success: true, message: "Car deleted successfully" };
            }

            throw new Error("Unexpected response status: " + response.status);
        } catch (error) {
            // Log the full error for debugging
            console.error("Delete car error details:", {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
                stack: error.stack,
            });

            // Handle specific status codes
            if (error.response?.status === 404) {
                throw new Error("Car not found or already deleted");
            }
            if (error.response?.status === 403) {
                throw new Error("You don't have permission to delete this car");
            }
            if (error.response?.status === 500) {
                throw new Error(
                    "Server error occurred while deleting the car. Please try again later."
                );
            }
            if (error.response?.data?.message) {
                throw new Error(
                    `Error deleting car: ${error.response.data.message}`
                );
            }

            // Generic error handler as fallback
            throw this.handleError(error);
        }
    },

    handleError(error) {
        // If the error has a response from the server
        if (error.response) {
            const message =
                error.response.data.message ||
                error.response.data.error ||
                "Server error occurred";
            const customError = new Error(message);
            customError.status = error.response.status;
            customError.data = error.response.data;
            return customError;
        }

        // If it's a client-side error (no response from server)
        if (error.request) {
            return new Error(
                "No response from server. Please check your connection."
            );
        }

        // For other types of errors
        return new Error(error.message || "An unexpected error occurred");
    },
};

export { carAPI };
