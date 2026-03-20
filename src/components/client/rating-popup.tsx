"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { getRatingStatus, submitRating } from "@/app/actions/rating";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function RatingPopup() {
    const { isRtl } = useLanguage();
    const [visible, setVisible] = useState(false);
    const [stars, setStars] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        getRatingStatus().then(({ shouldShow }) => {
            if (shouldShow) {
                // Delay so it doesn't pop up immediately on page load
                const t = setTimeout(() => setVisible(true), 2000);
                return () => clearTimeout(t);
            }
        });
    }, []);

    const handleSubmit = async () => {
        if (stars === 0) return;
        setSubmitting(true);
        try {
            await submitRating(stars, feedback.trim() || undefined);
            setSubmitted(true);
            setTimeout(() => setVisible(false), 1800);
            toast.success(isRtl ? "شكراً لتقييمك!" : "Thank you for your rating!");
        } catch {
            toast.error(isRtl ? "حدث خطأ، حاول مجدداً" : "Something went wrong, please try again");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={() => {}} // intentionally block close on backdrop
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-lg shadow-black/40 space-y-6"
                            dir={isRtl ? "rtl" : "ltr"}
                        >
                            {submitted ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center gap-4 py-4 text-center"
                                >
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                        <Star className="h-8 w-8 text-emerald-500 fill-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold tracking-tight">{isRtl ? "شكراً لك!" : "Thank You!"}</p>
                                        <p className="text-sm text-muted-foreground mt-1 opacity-70">
                                            {isRtl ? "تقييمك يساعدنا على التحسين المستمر" : "Your feedback helps us improve continuously"}
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className={`flex items-start justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <div className={isRtl ? 'text-right' : ''}>
                                            <h2 className="text-2xl font-bold tracking-tight">
                                                {isRtl ? "كيف تقيّم تجربتك معنا؟" : "How's your experience with us?"}
                                            </h2>
                                            <p className="text-sm text-muted-foreground mt-1 opacity-70">
                                                {isRtl ? "تقييمك الشهري يساعدنا على تقديم خدمة أفضل" : "Your monthly rating helps us serve you better"}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setVisible(false)}
                                            className="shrink-0 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Stars */}
                                    <div className={`flex items-center gap-2 justify-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <button
                                                key={n}
                                                onMouseEnter={() => setHovered(n)}
                                                onMouseLeave={() => setHovered(0)}
                                                onClick={() => setStars(n)}
                                                className="transition-transform hover:scale-110 active:scale-95"
                                            >
                                                <Star
                                                    className={`h-10 w-10 transition-colors ${
                                                        n <= (hovered || stars)
                                                            ? "text-yellow-400 fill-yellow-400"
                                                            : "text-muted-foreground/30"
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    {stars > 0 && (
                                        <p className="text-center text-sm font-bold text-muted-foreground">
                                            {isRtl ? (
                                                stars === 1 ? "سيء جداً" : stars === 2 ? "سيء" : stars === 3 ? "مقبول" : stars === 4 ? "جيد" : "ممتاز!"
                                            ) : (
                                                stars === 1 ? "Very Poor" : stars === 2 ? "Poor" : stars === 3 ? "Fair" : stars === 4 ? "Good" : "Excellent!"
                                            )}
                                        </p>
                                    )}

                                    {/* Feedback */}
                                    <Textarea
                                        placeholder={isRtl ? "أي ملاحظات إضافية؟ (اختياري)" : "Any additional feedback? (optional)"}
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        rows={3}
                                        className="bg-muted/30 border-border rounded-xl resize-none text-sm"
                                        dir={isRtl ? "rtl" : "ltr"}
                                    />

                                    {/* Actions */}
                                    <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={stars === 0 || submitting}
                                            className="flex-1 h-12 rounded-xl font-semibold shadow-lg shadow-primary/20"
                                        >
                                            {submitting
                                                ? (isRtl ? "جاري الإرسال..." : "Submitting...")
                                                : (isRtl ? "إرسال التقييم" : "Submit Rating")}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setVisible(false)}
                                            className="h-12 px-4 rounded-xl text-muted-foreground hover:text-foreground font-medium text-xs"
                                        >
                                            {isRtl ? "لاحقاً" : "Later"}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
