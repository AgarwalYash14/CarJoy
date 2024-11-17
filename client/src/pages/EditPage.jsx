import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    AlertCircle,
    ArrowLeft,
} from "lucide-react";

export default function Edit() {
    const navigate = useNavigate();
    const { id } = useParams();
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
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [focusedField, setFocusedField] = useState(null);
    const [errors, setErrors] = useState({});
    const [dragActive, setDragActive] = useState(false);
    const [existingImages, setExistingImages] = useState([]);
    const [removedImages, setRemovedImages] = useState([]);

    const imagesPerPage = 5;
    const totalPages = Math.ceil(
        (previewUrls.length + existingImages.length) / imagesPerPage
    );
    const baseImageURL = `${import.meta.env.VITE_BACKEND_URL}/uploads/`;

    useEffect(() => {
        fetchCarData();
    }, [id]);

    const fetchCarData = async () => {
        try {
            const car = await carAPI.getCarById(id);
            setFormData({
                title: car.title,
                description: car.description,
                images: [],
                tags: car.tags,
            });
            setExistingImages(car.images);
            setInitialLoading(false);
        } catch (error) {
            console.error("Error fetching car:", error);
            setErrors((prev) => ({
                ...prev,
                fetch: "Error loading car data. Please try again.",
            }));
            setInitialLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        } else if (formData.title.length < 3) {
            newErrors.title = "Title must be at least 3 characters";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        } else if (formData.description.length < 10) {
            newErrors.description =
                "Description must be at least 10 characters";
        }

        if (formData.images.length === 0 && existingImages.length === 0) {
            newErrors.images = "At least one image is required";
        }

        if (!formData.tags.car_type.trim()) {
            newErrors.car_type = "Car type is required";
        }

        if (!formData.tags.company.trim()) {
            newErrors.company = "Company is required";
        }

        if (!formData.tags.dealer.trim()) {
            newErrors.dealer = "Dealer is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || e.dataTransfer.files);

        const validFiles = files.filter((file) => {
            const isValid = file.type.startsWith("image/");
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
            return isValid && isValidSize;
        });

        if (
            validFiles.length + formData.images.length + existingImages.length >
            10
        ) {
            setErrors((prev) => ({
                ...prev,
                images: "Maximum 10 images allowed",
            }));
            return;
        }

        if (validFiles.length !== files.length) {
            setErrors((prev) => ({
                ...prev,
                images: "Some files were skipped. Images must be under 5MB",
            }));
        }

        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...validFiles],
        }));

        const newUrls = validFiles.map((file) => URL.createObjectURL(file));
        setPreviewUrls((prev) => [...prev, ...newUrls]);
        setErrors((prev) => ({ ...prev, images: null }));
    };

    const removeNewImage = (index) => {
        const newUrls = previewUrls.filter((_, i) => i !== index);
        const newFiles = Array.from(formData.images).filter(
            (_, i) => i !== index
        );

        URL.revokeObjectURL(previewUrls[index]);

        setPreviewUrls(newUrls);
        setFormData((prev) => ({ ...prev, images: newFiles }));

        if (currentPage >= Math.ceil(newUrls.length / imagesPerPage)) {
            setCurrentPage(
                Math.max(0, Math.ceil(newUrls.length / imagesPerPage) - 1)
            );
        }
    };

    const removeExistingImage = (filename) => {
        setExistingImages((prev) => prev.filter((img) => img !== filename));
        setRemovedImages((prev) => [...prev, filename]);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleImageChange(e);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const form = new FormData();
            form.append("title", formData.title);
            form.append("description", formData.description);
            form.append("tags", JSON.stringify(formData.tags));
            form.append("removedImages", JSON.stringify(removedImages));
            formData.images.forEach((file) => form.append("images", file));

            await carAPI.updateCar(id, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            navigate("/list");
        } catch (error) {
            console.error("Error updating car:", error);
            setErrors((prev) => ({
                ...prev,
                submit: "Error updating car listing. Please try again.",
            }));
        }
        setLoading(false);
    };

    const nextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage((curr) => curr + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage((curr) => curr - 1);
        }
    };

    // Cleanup URLs on unmount
    useEffect(() => {
        return () => {
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    if (initialLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full rounded-3xl relative p-10 overflow-hidden bg-gradient-to-br from-purple-700 to-purple-900"
        >
            <motion.button
                onClick={() => navigate("/list")}
                className="absolute top-6 left-6 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <ArrowLeft size={24} />
            </motion.button>

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
                    Edit Car
                </motion.h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Column - Images Upload */}
                    <motion.div
                        className="space-y-6"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div>
                            <label className="block font-medium text-white mb-2">
                                Car Images (Max 10)
                                <span className="text-red-400 ml-1">*</span>
                            </label>
                            <span className="text-sm text-white/60 block mb-4">
                                Upload up to 10 images, each under 5MB
                            </span>
                        </div>

                        <motion.div
                            className={`w-full aspect-video flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                                dragActive
                                    ? "border-white bg-white/10"
                                    : "border-white/30 hover:border-white/50 hover:bg-white/5"
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="image-upload"
                            />
                            <label
                                htmlFor="image-upload"
                                className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                            >
                                <Upload className="w-16 h-16 text-white/80 mb-4" />
                                <span className="text-xl text-white/80 font-medium">
                                    Drop your images here
                                </span>
                                <span className="text-sm text-white/60 mt-2">
                                    or click to browse
                                </span>
                            </label>
                        </motion.div>

                        {errors.images && (
                            <div className="text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {errors.images}
                            </div>
                        )}

                        {/* Image Grid */}
                        {(previewUrls.length > 0 ||
                            existingImages.length > 0) && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-5 gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {/* Existing Images */}
                                        {existingImages
                                            .slice(
                                                currentPage * imagesPerPage,
                                                (currentPage + 1) *
                                                    imagesPerPage
                                            )
                                            .map((filename, index) => (
                                                <motion.div
                                                    key={`existing-${filename}`}
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
                                                    className="relative aspect-video rounded-lg overflow-hidden group"
                                                >
                                                    <img
                                                        src={`${baseImageURL}${filename}`}
                                                        alt={`Existing ${
                                                            index + 1
                                                        }`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <motion.button
                                                        type="button"
                                                        onClick={() =>
                                                            removeExistingImage(
                                                                filename
                                                            )
                                                        }
                                                        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                        whileHover={{
                                                            scale: 1.1,
                                                        }}
                                                        whileTap={{
                                                            scale: 0.9,
                                                        }}
                                                    >
                                                        <X size={16} />
                                                    </motion.button>
                                                </motion.div>
                                            ))}

                                        {/* New Images */}
                                        {previewUrls
                                            .slice(
                                                Math.max(
                                                    0,
                                                    currentPage *
                                                        imagesPerPage -
                                                        existingImages.length
                                                ),
                                                (currentPage + 1) *
                                                    imagesPerPage -
                                                    existingImages.length
                                            )
                                            .map((url, index) => {
                                                const actualIndex =
                                                    Math.max(
                                                        0,
                                                        currentPage *
                                                            imagesPerPage -
                                                            existingImages.length
                                                    ) + index;
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
                                                        className="relative aspect-video rounded-lg overflow-hidden group"
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`Preview ${
                                                                actualIndex + 1
                                                            }`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <motion.button
                                                            type="button"
                                                            onClick={() =>
                                                                removeNewImage(
                                                                    actualIndex
                                                                )
                                                            }
                                                            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                            whileHover={{
                                                                scale: 1.1,
                                                            }}
                                                            whileTap={{
                                                                scale: 0.9,
                                                            }}
                                                        >
                                                            <X size={16} />
                                                        </motion.button>
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
                                    <span className="text-red-400 ml-1">*</span>
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
                                    className={`w-full rounded-xl bg-white/10 border px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 transition-all ${
                                        errors.title
                                            ? "border-red-400"
                                            : "border-white/20"
                                    }`}
                                    animate={{
                                        scale:
                                            focusedField === "title" ? 1.02 : 1,
                                    }}
                                    required
                                />
                                {errors.title && (
                                    <span className="text-sm text-red-400 mt-1">
                                        {errors.title}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Description
                                    <span className="text-red-400 ml-1">*</span>
                                </label>
                                <motion.textarea
                                    value={formData.description}
                                    style={{ resize: "none" }}
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
                                    className={`w-full rounded-xl bg-white/10 border px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 transition-all ${
                                        errors.description
                                            ? "border-red-400"
                                            : "border-white/20"
                                    }`}
                                    animate={{
                                        scale:
                                            focusedField === "description"
                                                ? 1.02
                                                : 1,
                                    }}
                                    required
                                    placeholder="Enter detailed description of the car"
                                />
                                {errors.description && (
                                    <span className="text-sm text-red-400 mt-1">
                                        {errors.description}
                                    </span>
                                )}
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
                                    placeholder: "e.g., SUV, Sedan",
                                },
                                {
                                    label: "Company",
                                    icon: Building2,
                                    key: "company",
                                    placeholder: "e.g., Toyota, BMW",
                                },
                                {
                                    label: "Dealer",
                                    icon: User,
                                    key: "dealer",
                                    placeholder: "Enter dealer name",
                                },
                            ].map(({ label, icon: Icon, key, placeholder }) => (
                                <div key={key} className="relative">
                                    <label className="block text-sm font-medium text-white/80 mb-2">
                                        {label}
                                        <span className="text-red-400 ml-1">
                                            *
                                        </span>
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
                                            placeholder={placeholder}
                                            className={`w-full rounded-xl bg-white/10 border pl-10 pr-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 transition-all ${
                                                errors[key]
                                                    ? "border-red-400"
                                                    : "border-white/20"
                                            }`}
                                            animate={{
                                                scale:
                                                    focusedField === key
                                                        ? 1.02
                                                        : 1,
                                            }}
                                        />
                                        {errors[key] && (
                                            <span className="text-sm text-red-400 mt-1 block">
                                                {errors[key]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                        {/* Error Alert */}
                        {errors.submit && (
                            <div className="text-red-400 text-sm mt-2">
                                {errors.submit}
                            </div>
                        )}

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white/20 backdrop-blur-sm text-white py-4 rounded-xl font-medium hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-8"
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                        >
                            {loading ? (
                                <motion.div className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                                    Updating...
                                </motion.div>
                            ) : (
                                "Update Car Listing"
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.form>
        </motion.div>
    );
}
