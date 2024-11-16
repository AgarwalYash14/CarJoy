import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { carAPI } from "../api/carApi";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Helper function remains the same
const extractColors = async (imgUrl) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const regions = [
                { x: 0, y: 0, w: canvas.width, h: canvas.height / 3 },
                {
                    x: 0,
                    y: canvas.height / 3,
                    w: canvas.width,
                    h: canvas.height / 3,
                },
                {
                    x: 0,
                    y: (2 * canvas.height) / 3,
                    w: canvas.width,
                    h: canvas.height / 3,
                },
            ];
            const colors = regions.map((region) => {
                const imageData = ctx.getImageData(
                    region.x,
                    region.y,
                    region.w,
                    region.h
                ).data;
                let r = 0,
                    g = 0,
                    b = 0;
                for (let i = 0; i < imageData.length; i += 16) {
                    r += imageData[i];
                    g += imageData[i + 1];
                    b += imageData[i + 2];
                }
                const pixels = imageData.length / 4;
                return {
                    r: Math.round(r / pixels),
                    g: Math.round(g / pixels),
                    b: Math.round(b / pixels),
                };
            });
            resolve(colors);
        };
        img.src = imgUrl;
    });
};

export default function HomePage() {
    const [selectedCar, setSelectedCar] = useState(null);
    const [carsList, setCarsList] = useState([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [gradientColors, setGradientColors] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [ref, inView] = useInView({
        threshold: 0.1,
        triggerOnce: false,
    });
    const { id } = useParams();
    const baseImageURL = `${import.meta.env.VITE_BACKEND_URL}/uploads/`;
    const imagesPerPage = 5;

    useEffect(() => {
        const fetchCars = async () => {
            try {
                const cars = await carAPI.getAllCars();
                setCarsList(cars);
                if (id) {
                    const car = await carAPI.getCarById(id);
                    setSelectedCar(car);
                } else if (cars.length > 0) {
                    setSelectedCar(cars[0]);
                }
            } catch (error) {
                console.error("Error fetching cars:", error);
            }
        };
        fetchCars();
    }, [id]);

    useEffect(() => {
        if (selectedCar?.images?.[selectedImage]) {
            const updateGradient = async () => {
                const colors = await extractColors(
                    `${baseImageURL}${selectedCar.images[selectedImage]}`
                );
                setGradientColors(colors);
            };
            updateGradient();
        }
    }, [selectedCar, selectedImage]);

    const totalPages = selectedCar
        ? Math.ceil(selectedCar.images.length / imagesPerPage)
        : 0;

    const nextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    if (!selectedCar) return <div>Loading...</div>;

    const gradientStyle = {
        background: gradientColors.length
            ? `linear-gradient(135deg,
                rgba(${gradientColors[0].r}, ${gradientColors[0].g}, ${gradientColors[0].b}, 0.9) 0%,
                rgba(${gradientColors[1].r}, ${gradientColors[1].g}, ${gradientColors[1].b}, 0.6) 50%,
                rgba(${gradientColors[2].r}, ${gradientColors[2].g}, ${gradientColors[2].b}, 0.8) 100%)`
            : "rgb(30, 30, 30)",
        transition: "background 1s cubic-bezier(0.4, 0, 0.2, 1)",
    };

    const handleCarChange = (car) => {
        setSelectedImage(0);
        setSelectedCar(car);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full rounded-3xl relative p-4 overflow-hidden"
            style={gradientStyle}
        >
            <div className="relative container">
                <div className="grid grid-cols-2 gap-8">
                    {/* Left Section - Car Details */}
                    <motion.div
                        className="text-white p-8"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.h1
                            className="text-8xl font-bold mb-6"
                            layoutId={`title-${selectedCar._id}`}
                        >
                            {selectedCar.title}
                        </motion.h1>

                        <motion.div
                            className="flex flex-wrap gap-2 mb-6"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {Object.entries(selectedCar.tags).map(
                                ([key, value]) => (
                                    <span
                                        key={key}
                                        className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm"
                                    >
                                        {value}
                                    </span>
                                )
                            )}
                        </motion.div>

                        <motion.p
                            className="text-lg mb-8 text-white/90"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            {selectedCar.description}
                        </motion.p>
                    </motion.div>

                    {/* Right Section - Main Image */}
                    <motion.div
                        className="w-full h-full"
                        layoutId={`main-image-${selectedCar._id}-${selectedImage}`}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={`${selectedCar._id}-${selectedImage}`}
                                className="relative aspect-[16/9] rounded-2xl overflow-hidden"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <img
                                    src={`${baseImageURL}${selectedCar.images[selectedImage]}`}
                                    alt={selectedCar.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>

                    {/* Thumbnail Carousel */}
                    <motion.div
                        className="col-span-2 px-8 space-y-4"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="relative">
                            <div className="grid grid-cols-5 gap-2">
                                <AnimatePresence mode="popLayout">
                                    {selectedCar.images
                                        .slice(
                                            currentPage * imagesPerPage,
                                            (currentPage + 1) * imagesPerPage
                                        )
                                        .map((image, index) => {
                                            const actualIndex =
                                                currentPage * imagesPerPage +
                                                index;
                                            return (
                                                <motion.div
                                                    key={image}
                                                    className={`relative cursor-pointer overflow-hidden rounded-lg aspect-video
                                                        ${
                                                            selectedImage ===
                                                            actualIndex
                                                                ? "ring-2 ring-white"
                                                                : ""
                                                        }`}
                                                    whileHover={{ scale: 1.05 }}
                                                    onClick={() =>
                                                        setSelectedImage(
                                                            actualIndex
                                                        )
                                                    }
                                                    initial={{
                                                        opacity: 0,
                                                        scale: 0.8,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        scale: 1,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        scale: 0.8,
                                                    }}
                                                >
                                                    <img
                                                        src={`${baseImageURL}${image}`}
                                                        alt={`${
                                                            selectedCar.title
                                                        } - ${actualIndex + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </motion.div>
                                            );
                                        })}
                                </AnimatePresence>
                            </div>
                            {totalPages > 1 && (
                                <div className="flex justify-between mt-4">
                                    <motion.button
                                        onClick={prevPage}
                                        disabled={currentPage === 0}
                                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full disabled:opacity-50"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <ChevronLeft
                                            className="text-white"
                                            size={24}
                                        />
                                    </motion.button>
                                    <motion.button
                                        onClick={nextPage}
                                        disabled={
                                            currentPage === totalPages - 1
                                        }
                                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full disabled:opacity-50"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <ChevronRight
                                            className="text-white"
                                            size={24}
                                        />
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Tabs - Modernized Design */}
            <motion.div className="absolute bottom-4 left-0 right-0">
                <div className="container mx-auto px-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2">
                        <div className="flex gap-2 overflow-hidden">
                            {carsList.map((car) => (
                                <motion.button
                                    key={car._id}
                                    onClick={() => handleCarChange(car)}
                                    className={`
                                        relative flex-shrink-0 px-6 py-3 rounded-xl cursor-pointer
                                        transition-all duration-300 ease-in-out
                                        ${
                                            selectedCar._id === car._id
                                                ? "bg-white text-black shadow-lg"
                                                : "text-white hover:bg-white/20"
                                        }
                                    `}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {car.title}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
