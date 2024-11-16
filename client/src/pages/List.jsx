import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { carAPI } from "../api/carApi";
import { Link } from "react-router-dom";

export default function ListPage() {
    const [cars, setCars] = useState([]);
    const [filteredCars, setFilteredCars] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCar, setSelectedCar] = useState(null);
    const [gradientColors, setGradientColors] = useState([]);
    const baseImageURL = `${import.meta.env.VITE_BACKEND_URL}/uploads/`;

    useEffect(() => {
        const fetchCars = async () => {
            try {
                const fetchedCars = await carAPI.getAllCars();
                setCars(fetchedCars);
                setFilteredCars(fetchedCars);
                if (fetchedCars.length > 0) {
                    setSelectedCar(fetchedCars[0]);
                }
            } catch (error) {
                console.error("Error fetching cars:", error);
            }
        };
        fetchCars();
    }, []);

    useEffect(() => {
        const filtered = cars.filter(
            (car) =>
                car.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                car.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                Object.values(car.tags).some((tag) =>
                    tag.toLowerCase().includes(searchQuery.toLowerCase())
                )
        );
        setFilteredCars(filtered);
    }, [searchQuery, cars]);

    const gradientStyle = {
        background: gradientColors.length
            ? `linear-gradient(135deg,
                rgba(${gradientColors[0]?.r}, ${gradientColors[0]?.g}, ${gradientColors[0]?.b}, 0.9) 0%,
                rgba(${gradientColors[1]?.r}, ${gradientColors[1]?.g}, ${gradientColors[1]?.b}, 0.6) 50%,
                rgba(${gradientColors[2]?.r}, ${gradientColors[2]?.g}, ${gradientColors[2]?.b}, 0.8) 100%)`
            : "rgb(30, 30, 30)",
        transition: "background 1s cubic-bezier(0.4, 0, 0.2, 1)",
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full rounded-3xl relative p-4 overflow-hidden"
            style={gradientStyle}
        >
            <div className="container mx-auto space-y-6">
                {/* Search Bar */}
                <motion.div
                    className="relative"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    <div className="w-full max-w-2xl mx-auto">
                        <div className="relative flex items-center">
                            <MagnifyingGlass
                                className="absolute left-4 text-gray-500"
                                size={24}
                            />
                            <input
                                type="text"
                                placeholder="Search cars..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-14 pl-12 pr-4 bg-white/10 backdrop-blur-md text-white rounded-full 
                                         border border-white/20 focus:outline-none focus:border-white/40 transition-all"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Cars Grid */}
                <motion.div
                    className="min-h-[90vh] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <AnimatePresence mode="popLayout">
                        {filteredCars.map((car) => (
                            <motion.div
                                key={car._id}
                                layoutId={`car-card-${car._id}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group"
                            >
                                <Link to={`/car/${car._id}`}>
                                    <div
                                        className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md p-4 
                                                  hover:bg-white/20 transition-all duration-300"
                                    >
                                        <div className="aspect-video rounded-xl overflow-hidden mb-4">
                                            <img
                                                src={`${baseImageURL}${car.images[0]}`}
                                                alt={car.title}
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <motion.h2
                                            className="text-2xl font-bold text-white mb-2"
                                            layoutId={`title-${car._id}`}
                                        >
                                            {car.title}
                                        </motion.h2>
                                        <p className="text-white/80 line-clamp-2 mb-4">
                                            {car.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(car.tags).map(
                                                ([key, value]) => (
                                                    <span
                                                        key={key}
                                                        className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/90"
                                                    >
                                                        {value}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Empty State */}
                {filteredCars.length === 0 && (
                    <motion.div
                        className="text-center text-white/80 py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p className="text-xl">
                            No cars found matching your search.
                        </p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
