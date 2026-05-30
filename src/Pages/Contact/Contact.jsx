import React, { useState } from "react";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Contact = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/contact-messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const result = await response.json();

            if (result.success) {
                toast.success("Message sent successfully");
                setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    subject: "",
                    message: "",
                });
            } else {
                toast.error(result.message || "Failed to send message");
            }
        } catch (error) {
            console.error("Failed to send contact message:", error);
            toast.error("Failed to send message");
        } finally {
            setIsSubmitting(false);
        }
    };

    const contactInfo = [
        {
            icon: FaPhoneAlt,
            title: t("contact_phone"),
            value: "+880 1323-228118",
            link: "tel:+880 1323-228118",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10"
        },
        {
            icon: FaEnvelope,
            title: t("contact_email"),
            value: "info@ictdlab.gov.bd",
            link: "mailto:info@ictdlab.gov.bd",
            color: "text-blue-400",
            bg: "bg-blue-500/10"
        },
        {
            icon: FaMapMarkerAlt,
            title: t("contact_address"),
            value: "E-14/X, ICT Tower, Agargaon, Dhaka-1207",
            link: "#",
            color: "text-purple-400",
            bg: "bg-purple-500/10"
        },
    ];

    return (
        <section
            id="contact-section"
            className="relative py-16 lg:py-12 bg-emerald-50 overflow-hidden font-sans"
        >
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-200/40 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[100px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-teal-200/30 rounded-full blur-[80px]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-6 z-10">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 lg:mb-20"
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-widest uppercase mb-4">
                        Get in Touch
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-emerald-950 tracking-tight mb-6">
                        {t("contact_title")}
                    </h2>
                    <p className="text-emerald-700 max-w-2xl mx-auto text-lg leading-relaxed">
                        {t("contact_subtitle")}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    {/* Contact Info Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-5 space-y-8"
                    >
                        <div className="bg-white backdrop-blur-xl border border-emerald-100 rounded-3xl p-8 lg:p-10 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <h3 className="text-2xl font-bold text-emerald-950 mb-2 relative z-10">{t("contact_info_title")}</h3>
                            <p className="text-emerald-600 mb-8 relative z-10">{t("contact_info_desc")}</p>

                            <div className="space-y-6 relative z-10">
                                {contactInfo.map((item, index) => (
                                    <a
                                        key={index}
                                        href={item.link}
                                        className="flex items-start gap-5 p-4 rounded-2xl hover:bg-emerald-50 transition-all duration-300 group/item"
                                    >
                                        <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform duration-300`}>
                                            <item.icon className={`text-xl ${item.color}`} />
                                        </div>
                                        <div>
                                            <h4 className="text-emerald-800 font-semibold text-sm uppercase tracking-wide opacity-80 mb-1">{item.title}</h4>
                                            <p className="text-emerald-950 font-medium text-lg group-hover/item:text-emerald-600 transition-colors">{item.value}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>

                            {/* Social Links */}
                            <div className="mt-10 pt-8 border-t border-emerald-100 relative z-10">
                                <h4 className="text-emerald-800 font-semibold mb-4">Follow Us</h4>
                                <div className="flex gap-4">
                                    {[FaFacebookF, FaTwitter, FaLinkedinIn].map((Icon, i) => (
                                        <a key={i} href="#" className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 hover:-translate-y-1 border border-emerald-100">
                                            <Icon />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="lg:col-span-7"
                    >
                        <div className="bg-white backdrop-blur-xl border border-emerald-100 rounded-3xl p-8 lg:p-12 shadow-xl">
                            <h3 className="text-2xl font-bold text-emerald-950 mb-8 flex items-center gap-3">
                                <span className="w-8 h-1 bg-emerald-500 rounded-full"></span>
                                {t("contact_form_title")}
                            </h3>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-emerald-700 ml-1">{t("contact_label_fname")}</label>
                                        <input
                                            name="firstName"
                                            type="text"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            placeholder="First Name"
                                            className="w-full px-5 py-4 rounded-xl bg-white border border-emerald-200 text-emerald-900 placeholder-emerald-300 focus:border-emerald-400 focus:bg-emerald-50 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-emerald-700 ml-1">{t("contact_label_lname")}</label>
                                        <input
                                            name="lastName"
                                            type="text"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder="Last name"
                                            className="w-full px-5 py-4 rounded-xl bg-white border border-emerald-200 text-emerald-900 placeholder-emerald-300 focus:border-emerald-400 focus:bg-emerald-50 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-emerald-700 ml-1">Email Address</label>
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="your@example.com"
                                            className="w-full px-5 py-4 rounded-xl bg-white border border-emerald-200 text-emerald-900 placeholder-emerald-300 focus:border-emerald-400 focus:bg-emerald-50 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-emerald-700 ml-1">Phone Number</label>
                                        <input
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+880..."
                                            className="w-full px-5 py-4 rounded-xl bg-white border border-emerald-200 text-emerald-900 placeholder-emerald-300 focus:border-emerald-400 focus:bg-emerald-50 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-emerald-700 ml-1">Subject</label>
                                    <input
                                        name="subject"
                                        type="text"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        placeholder="How can we help?"
                                        className="w-full px-5 py-4 rounded-xl bg-white border border-emerald-200 text-emerald-900 placeholder-emerald-300 focus:border-emerald-400 focus:bg-emerald-50 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-emerald-700 ml-1">Message</label>
                                    <textarea
                                        name="message"
                                        rows="4"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        placeholder="Write your message here..."
                                        className="w-full px-5 py-4 rounded-xl bg-white border border-emerald-200 text-emerald-900 placeholder-emerald-300 focus:border-emerald-400 focus:bg-emerald-50 focus:ring-4 focus:ring-emerald-100 transition-all outline-none resize-none"
                                    />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-200/40 hover:shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition-all duration-300"
                                >
                                    <FaPaperPlane className="text-sm" />
                                    {isSubmitting ? "Sending..." : t("contact_btn_send")}
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
