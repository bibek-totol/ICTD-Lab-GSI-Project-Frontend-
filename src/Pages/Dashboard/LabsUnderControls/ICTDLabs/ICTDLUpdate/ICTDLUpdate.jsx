import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router";
import { Link } from "react-router";
import {
    HiOutlineOfficeBuilding,
    HiOutlineLocationMarker,
    HiOutlineAcademicCap,
    HiOutlineIdentification,
    HiOutlineSave,
    HiOutlineArrowLeft,
    HiOutlinePhotograph,
    HiOutlineX,
} from "react-icons/hi";
import { FaMapMarkerAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ICTDLUpdate = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm();

    const [labData, setLabData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [labImages, setLabImages] = useState([]);
    const [institutionImages, setInstitutionImages] = useState([]);
    const [isPending, setIsPending] = useState(false);
    const [imagesToDelete, setImagesToDelete] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/ictdl/${id}`);
                const result = await response.json();

                if (result.success && result.data) {
                    const data = result.data;
                    setLabData(data);

                    // Pre-fill form
                    setValue("division", data.division);
                    setValue("district", data.district);
                    setValue("upazila", data.upazila);
                    setValue("head", data.head);
                    setValue("email", data.email);
                    setValue("mobile", data.mobile);
                    setValue("lat", data.lat);
                    setValue("long", data.long);

                    // Load images
                    if (data.labImages) {
                        setLabImages(data.labImages.map(url => ({ url })));
                    }
                    if (data.institutionImages) {
                        setInstitutionImages(data.institutionImages.map(url => ({ url })));
                    }
                }
            } catch (error) {
                console.error("Error fetching ICTDL lab:", error);
                toast.error("Failed to load lab data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, setValue]);

    const getCurrentLocation = () => {
        setIsGettingLocation(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setValue("lat", position.coords.latitude);
                    setValue("long", position.coords.longitude);
                    setIsGettingLocation(false);
                    toast.success("Location updated successfully!");
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setIsGettingLocation(false);
                    toast.error("Failed to get location. Please enable location access.");
                }
            );
        } else {
            setIsGettingLocation(false);
            toast.error("Geolocation is not supported by your browser.");
        }
    };

    const handleImageChange = (e, type) => {
        const files = Array.from(e.target.files);
        const currentImages = type === 'lab' ? labImages : institutionImages;

        if (currentImages.length + files.length > 2) {
            toast.error("You can only upload a maximum of 2 images.");
            return;
        }

        const newImages = files.map(file => ({
            file,
            url: URL.createObjectURL(file)
        }));

        if (type === 'lab') {
            setLabImages([...labImages, ...newImages]);
        } else {
            setInstitutionImages([...institutionImages, ...newImages]);
        }
    };

    const removeImage = (type, index) => {
        if (type === 'lab') {
            const img = labImages[index];
            if (img.url && !img.file) {
                setImagesToDelete(prev => [...prev, img.url]);
            }
            if (img.file) URL.revokeObjectURL(img.url);
            setLabImages(labImages.filter((_, i) => i !== index));
        } else {
            const img = institutionImages[index];
            if (img.url && !img.file) {
                setImagesToDelete(prev => [...prev, img.url]);
            }
            if (img.file) URL.revokeObjectURL(img.url);
            setInstitutionImages(institutionImages.filter((_, i) => i !== index));
        }
    };

    const onSubmit = async (data) => {
        setIsPending(true);
        const formData = new FormData();

        formData.append("division", data.division || "");
        formData.append("district", data.district || "");
        formData.append("upazila", data.upazila || "");
        formData.append("head", data.head);
        formData.append("email", data.email || "");
        formData.append("mobile", data.mobile);
        formData.append("lat", data.lat);
        formData.append("long", data.long);

        // Existing images
        const activeLabUrls = labImages.filter(img => !img.file).map(img => img.url);
        if (activeLabUrls.length > 0) activeLabUrls.forEach(url => formData.append("labImages", url));
        else if (labImages.filter(img => img.file).length === 0) formData.append("labImages", "");

        const activeInstUrls = institutionImages.filter(img => !img.file).map(img => img.url);
        if (activeInstUrls.length > 0) activeInstUrls.forEach(url => formData.append("institutionImages", url));
        else if (institutionImages.filter(img => img.file).length === 0) formData.append("institutionImages", "");

        // New files
        labImages.filter(img => img.file).forEach(img => formData.append("labImages", img.file));
        institutionImages.filter(img => img.file).forEach(img => formData.append("institutionImages", img.file));

        if (imagesToDelete.length > 0) {
            formData.append("deletedImages", JSON.stringify(imagesToDelete));
        }

        try {
            const response = await fetch(`${API_BASE_URL}/ictdl/update/${id}`, {
                method: "PUT",
                body: formData,
            });
            const result = await response.json();
            if (result.success) {
                toast.success("Lab updated successfully!");
                navigate("/dashboard/ictdLabs");
            } else {
                toast.error(result.message || "Update failed");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Internal server error");
        } finally {
            setIsPending(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-emerald-900 font-bold">লোড হচ্ছে...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-emerald-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between no-print">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard/ictdLabs" className="p-2 bg-white rounded-full text-emerald-600 hover:bg-emerald-50 transition-colors shadow-sm border border-emerald-100">
                            <HiOutlineArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-emerald-950">ল্যাব হালনাগাদ করুন</h1>
                            <p className="text-emerald-600 font-medium">{labData?.institute}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isPending}
                        className="cursor-pointer hover:scale-105 flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg transition-all font-semibold disabled:opacity-50"
                    >
                        {isPending ? <HiOutlineSave className="w-5 h-5 animate-spin" /> : <HiOutlineSave className="w-5 h-5" />}
                        {isPending ? "সংরক্ষণ করা হচ্ছে..." : "সংরক্ষণ করুন"}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Institution Info (Read-only) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 space-y-6">
                        <div className="flex items-center gap-4 mb-2 pb-4 border-b border-emerald-50">
                            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><HiOutlineOfficeBuilding className="w-6 h-6" /></div>
                            <div><h3 className="font-bold text-emerald-950">প্রতিষ্ঠানের তথ্য</h3><p className="text-xs text-emerald-500 uppercase font-semibold">মৌলিক তথ্য (অপরিবর্তনযোগ্য)</p></div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-emerald-600 uppercase">প্রতিষ্ঠানের নাম</label>
                                <div className="mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 font-medium">
                                    {labData?.institute}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-emerald-600 uppercase">বিভাগ</label>
                                    <input type="text" {...register("division")} className="mt-1 w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-emerald-600 uppercase">জেলা</label>
                                    <input type="text" {...register("district")} className="mt-1 w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-emerald-600 uppercase">উপজেলা</label>
                                    <input type="text" {...register("upazila")} className="mt-1 w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 space-y-6">
                        <div className="flex items-center gap-4 mb-2 pb-4 border-b border-emerald-50 text-right">
                            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><HiOutlineLocationMarker className="w-6 h-6" /></div>
                            <div><h3 className="font-bold text-emerald-950">অবস্থান</h3><p className="text-xs text-emerald-500 uppercase font-semibold">ভৌগোলিক তথ্য</p></div>
                        </div>
                        <div className="space-y-4">
                            <button type="button" onClick={getCurrentLocation} className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-all font-semibold"><FaMapMarkerAlt className={isGettingLocation ? "animate-bounce" : ""} /> {isGettingLocation ? "অবস্থান খোঁজা হচ্ছে..." : "আমার বর্তমান অবস্থান ব্যবহার করুন"}</button>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-emerald-600 uppercase">অক্ষাংশ (Lat)</label><input type="text" {...register("lat")} className="mt-1 w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none" /></div>
                                <div><label className="text-xs font-bold text-emerald-600 uppercase">দ্রাঘিমাংশ (Long)</label><input type="text" {...register("long")} className="mt-1 w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none" /></div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info (Editable) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 space-y-6">
                        <div className="flex items-center gap-4 mb-2 pb-4 border-b border-emerald-50">
                            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><HiOutlineIdentification className="w-6 h-6" /></div>
                            <div><h3 className="font-bold text-emerald-950">যোগাযোগের তথ্য</h3><p className="text-xs text-emerald-500 uppercase font-semibold">প্রতিষ্ঠান প্রধান ও যোগাযোগ</p></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-emerald-600 uppercase">প্রতিষ্ঠান প্রধানের নাম</label><input type="text" {...register("head")} className="mt-1 w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none" /></div>
                            <div><label className="text-xs font-bold text-emerald-600 uppercase">মোবাইল নম্বর</label><input type="text" {...register("mobile")} className="mt-1 w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none" /></div>
                            <div><label className="text-xs font-bold text-emerald-600 uppercase">ইমেইল</label><input type="email" {...register("email")} className="mt-1 w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none" /></div>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 space-y-6">
                        <div className="flex items-center gap-4 mb-2 pb-4 border-b border-emerald-50">
                            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><HiOutlinePhotograph className="w-6 h-6" /></div>
                            <div><h3 className="font-bold text-emerald-950">ছবি আপলোড</h3><p className="text-xs text-emerald-500 uppercase font-semibold">ল্যাব এবং প্রতিষ্ঠানের ছবি (সর্বোচ্চ ২ টি)</p></div>
                        </div>

                        <div className="space-y-6">
                            {/* Lab Images */}
                            <div>
                                <label className="text-sm font-bold text-emerald-700 block mb-2">ল্যাবের ছবি (সর্বোচ্চ ২ টি)</label>
                                <input type="file" multiple accept="image/*" onChange={(e) => handleImageChange(e, 'lab')} className="w-full text-sm text-emerald-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer" />
                                <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                                    {labImages.map((img, idx) => (
                                        <div key={idx} className="relative w-32 h-32 flex-shrink-0 group"><img src={img.url} className="w-full h-full object-cover rounded-xl border-2 border-emerald-100 shadow-sm transition-transform group-hover:scale-105" /><button onClick={() => removeImage('lab', idx)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"><HiOutlineX className="w-4 h-4" /></button></div>
                                    ))}
                                </div>
                            </div>

                            {/* Institution Images */}
                            <div>
                                <label className="text-sm font-bold text-emerald-700 block mb-2">প্রতিষ্ঠানের ছবি (সর্বোচ্চ ২ টি)</label>
                                <input type="file" multiple accept="image/*" onChange={(e) => handleImageChange(e, 'inst')} className="w-full text-sm text-emerald-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer" />
                                <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                                    {institutionImages.map((img, idx) => (
                                        <div key={idx} className="relative w-32 h-32 flex-shrink-0 group"><img src={img.url} className="w-full h-full object-cover rounded-xl border-2 border-emerald-100 shadow-sm transition-transform group-hover:scale-105" /><button onClick={() => removeImage('inst', idx)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"><HiOutlineX className="w-4 h-4" /></button></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ICTDLUpdate;
