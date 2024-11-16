import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { carAPI } from "../api/carApi";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    X,
    Car,
    Building2,
    User,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

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

export default function Add() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        images: [],
        tags: {
            car_type: "",
            company: "",
            dealer: "",
        },
    });
    const [previewUrls, setPreviewUrls] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [gradientColors, setGradientColors] = useState([]);

    const imagesPerPage = 5;
    const totalPages = Math.ceil(previewUrls.length / imagesPerPage);
    const currentPage = Math.floor(currentImageIndex / imagesPerPage);

    useEffect(() => {
        if (previewUrls[currentImageIndex]) {
            const updateGradient = async () => {
                const colors = await extractColors(
                    previewUrls[currentImageIndex]
                );
                setGradientColors(colors);
            };
            updateGradient();
        }
    }, [currentImageIndex, previewUrls]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 10) {
            alert("Maximum 10 images allowed");
            return;
        }

        setFormData((prev) => ({ ...prev, images: files }));
        const urls = files.map((file) => URL.createObjectURL(file));
        setPreviewUrls(urls);
    };

    const removeImage = (index) => {
        const newUrls = previewUrls.filter((_, i) => i !== index);
        const newFiles = Array.from(formData.images).filter(
            (_, i) => i !== index
        );
        setPreviewUrls(newUrls);
        setFormData((prev) => ({ ...prev, images: newFiles }));
        if (currentImageIndex >= newUrls.length) {
            setCurrentImageIndex(Math.max(0, newUrls.length - 1));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const form = new FormData();
            form.append("title", formData.title);
            form.append("description", formData.description);
            form.append("tags", JSON.stringify(formData.tags));
            formData.images.forEach((file) => form.append("images", file));

            await carAPI.createCar(form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            navigate("/list");
        } catch (error) {
            console.error("Error creating car:", error);
            alert("Error creating car listing");
        }
        setLoading(false);
    };

    const gradientStyle = {
        background: gradientColors.length
            ? `linear-gradient(135deg,
                rgba(${gradientColors[0].r}, ${gradientColors[0].g}, ${gradientColors[0].b}, 0.9) 0%,
                rgba(${gradientColors[1].r}, ${gradientColors[1].g}, ${gradientColors[1].b}, 0.6) 50%,
                rgba(${gradientColors[2].r}, ${gradientColors[2].g}, ${gradientColors[2].b}, 0.8) 100%)`
            : "rgb(109, 40, 217)",
        transition: "background 1s cubic-bezier(0.4, 0, 0.2, 1)",
    };

    const nextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentImageIndex((currentPage + 1) * imagesPerPage);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentImageIndex((currentPage - 1) * imagesPerPage);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full rounded-3xl relative p-10 overflow-hidden"
            style={gradientStyle}
        >
            <motion.form
                onSubmit={handleSubmit}
                className="container mx-auto space-y-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.h1
                    className="text-6xl font-bold text-white mb-12"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Add New Car
                </motion.h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Column - Images Upload */}
                    <motion.div
                        className="space-y-6"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <label className="block font-medium text-white mb-2">
                            Car Images (Max 10)
                        </label>

                        {previewUrls.length > 0 ? (
                            <div className="space-y-6">
                                {/* Main Preview */}
                                <motion.div
                                    className="relative aspect-[16/9] rounded-2xl overflow-hidden"
                                    layoutId={`preview-${currentImageIndex}`}
                                >
                                    <img
                                        src={previewUrls[currentImageIndex]}
                                        alt={`Preview ${currentImageIndex + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <motion.button
                                        type="button"
                                        onClick={() =>
                                            removeImage(currentImageIndex)
                                        }
                                        className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full text-white transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X size={20} />
                                    </motion.button>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </motion.div>

                                {/* Carousel */}
                                <div className="relative">
                                    <div className="grid grid-cols-5 gap-4">
                                        <AnimatePresence mode="popLayout">
                                            {previewUrls
                                                .slice(
                                                    currentPage * imagesPerPage,
                                                    (currentPage + 1) *
                                                        imagesPerPage
                                                )
                                                .map((url, index) => {
                                                    const actualIndex =
                                                        currentPage *
                                                            imagesPerPage +
                                                        index;
                                                    return (
                                                        <motion.div
                                                            key={url}
                                                            layout
                                                            initial={{
                                                                scale: 0,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                scale: 1,
                                                                opacity: 1,
                                                            }}
                                                            exit={{
                                                                scale: 0,
                                                                opacity: 0,
                                                            }}
                                                            className={`relative aspect-video cursor-pointer rounded-lg overflow-hidden ${
                                                                currentImageIndex ===
                                                                actualIndex
                                                                    ? "ring-2 ring-white"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                setCurrentImageIndex(
                                                                    actualIndex
                                                                )
                                                            }
                                                        >
                                                            <img
                                                                src={url}
                                                                alt={`Thumbnail ${
                                                                    actualIndex +
                                                                    1
                                                                }`}
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
                                                type="button"
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
                                                type="button"
                                                onClick={nextPage}
                                                disabled={
                                                    currentPage ===
                                                    totalPages - 1
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
                            </div>
                        ) : (
                            <motion.label
                                className="w-full aspect-video flex flex-col items-center justify-center border-2 border-dashed border-white/30 rounded-2xl cursor-pointer hover:border-white/50 hover:bg-white/5 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <Upload className="w-16 h-16 text-white/80 mb-4" />
                                <span className="text-xl text-white/80 font-medium">
                                    Drop your images here
                                </span>
                                <span className="text-sm text-white/60 mt-2">
                                    or click to browse
                                </span>
                            </motion.label>
                        )}
                    </motion.div>

                    {/* Right Column - Form Fields */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Title
                                </label>
                                <motion.input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    onFocus={() => setFocusedField("title")}
                                    onBlur={() => setFocusedField(null)}
                                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                                    animate={{
                                        scale:
                                            focusedField === "title" ? 1.02 : 1,
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Description
                                </label>
                                <motion.textarea
                                    value={formData.description}
                                    style={{ resize: 'none' }}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    onFocus={() =>
                                        setFocusedField("description")
                                    }
                                    onBlur={() => setFocusedField(null)}
                                    rows={4}
                                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                                    animate={{
                                        scale:
                                            focusedField === "description"
                                                ? 1.02
                                                : 1,
                                    }}
                                    required
                                />
                            </div>
                        </motion.div>

                        {/* Tags */}
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            {[
                                {
                                    label: "Car Type",
                                    icon: Car,
                                    key: "car_type",
                                },
                                {
                                    label: "Company",
                                    icon: Building2,
                                    key: "company",
                                },
                                { label: "Dealer", icon: User, key: "dealer" },
                            ].map(({ label, icon: Icon, key }) => (
                                <div key={key} className="relative">
                                    <label className="block text-sm font-medium text-white/80 mb-2">
                                        {label}
                                    </label>
                                    <div className="relative">
                                        <Icon
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50"
                                            size={18}
                                        />
                                        <motion.input
                                            type="text"
                                            value={formData.tags[key]}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    tags: {
                                                        ...prev.tags,
                                                        [key]: e.target.value,
                                                    },
                                                }))
                                            }
                                            onFocus={() => setFocusedField(key)}
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                                            animate={{
                                                scale:
                                                    focusedField === key
                                                        ? 1.02
                                                        : 1,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white/20 backdrop-blur-sm text-white py-4 rounded-xl font-medium hover:bg-white/30 disabled:opacity-50 transition-colors mt-8"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                        >
                            {loading ? (
                                <motion.div
                                    className="flex items-center justify-center"
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                >
                                    Creating...
                                </motion.div>
                            ) : (
                                "Create Car Listing"
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.form>
        </motion.div>
    );
}
