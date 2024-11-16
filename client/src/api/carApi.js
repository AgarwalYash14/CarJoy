import axios from "axios";

const carAPI = {
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/cars`,

    async createCar(carData) {
        const response = await axios.post(this.baseURL, carData, {
            withCredentials: true,
        });
        return response.data;
    },

    async getAllCars() {
        const response = await axios.get(this.baseURL, {
            withCredentials: true,
        });
        return response.data;
    },

    async getCarById(id) {
        const response = await axios.get(`${this.baseURL}/${id}`, {
            withCredentials: true,
        });
        return response.data;
    },

    async updateCar(id, carData) {
        const response = await axios.put(`${this.baseURL}/${id}`, carData, {
            withCredentials: true,
        });
        return response.data;
    },

    async deleteCar(id) {
        const response = await axios.delete(`${this.baseURL}/${id}`, {
            withCredentials: true,
        });
        return response.data;
    },
};

export { carAPI };
