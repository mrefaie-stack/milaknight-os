"use client";

import { Video, ExternalLink } from "lucide-react";

interface VideoPlayerProps {
    url: string;
    isRtl?: boolean;
    showExternalLink?: boolean;
}

export function VideoPlayer({ url, isRtl, showExternalLink = true }: VideoPlayerProps) {
    if (!url) return null;

    // Helper to get embed URL
    const getEmbedUrl = (url: string) => {
        try {
            const videoUrl = new URL(url);

            // YouTube
            if (videoUrl.hostname.includes("youtube.com") || videoUrl.hostname.includes("youtu.be")) {
                let videoId = "";
                if (videoUrl.hostname.includes("youtu.be")) {
                    videoId = videoUrl.pathname.slice(1);
                } else if (videoUrl.pathname.includes("shorts")) {
                    videoId = videoUrl.pathname.split("/").pop() || "";
                } else {
                    videoId = videoUrl.searchParams.get("v") || "";
                }

                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}`;
                }
            }

            // Vimeo
            if (videoUrl.hostname.includes("vimeo.com")) {
                const videoId = videoUrl.pathname.split("/").pop();
                if (videoId) {
                    return `https://player.vimeo.com/video/${videoId}`;
                }
            }

            // Google Drive
            if (videoUrl.hostname.includes("drive.google.com")) {
                // Change /view?usp=sharing or /file/d/ID/view to /preview
                const videoIdMatch = url.match(/\/file\/d\/([^\/]+)/) || url.match(/id=([^\&]+)/);
                const videoId = videoIdMatch ? videoIdMatch[1] : null;
                if (videoId) {
                    return `https://drive.google.com/file/d/${videoId}/preview`;
                }
            }

            // Direct Video File
            if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
                return null; // Return null to use <video> tag
            }

            return null;
        } catch (e) {
            return null;
        }
    };

    const embedUrl = getEmbedUrl(url);
    const isDirectVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);

    if (embedUrl) {
        return (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/20 border border-white/10 group-hover:scale-[1.02] transition-transform duration-500 shadow-xl">
                <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video Player"
                />
                {showExternalLink && (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`absolute bottom-3 ${isRtl ? 'left-3' : 'right-3'} p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white/80 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest`}
                    >
                        <ExternalLink className="h-3 w-3" />
                        {isRtl ? 'فتح الرابط' : 'Open Link'}
                    </a>
                )}
            </div>
        );
    }

    if (isDirectVideo) {
        return (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/20 border border-white/10 group-hover:scale-[1.02] transition-transform duration-500 shadow-xl">
                <video
                    src={url}
                    controls
                    className="w-full h-full object-contain"
                />
                {showExternalLink && (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`absolute bottom-10 ${isRtl ? 'left-3' : 'right-3'} p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white/80 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest`}
                    >
                        <ExternalLink className="h-3 w-3" />
                        {isRtl ? 'فتح الرابط' : 'Open Link'}
                    </a>
                )}
            </div>
        );
    }

    // Fallback: External link with nice UI
    return (
        <div className="w-full aspect-video flex items-center justify-center bg-black/40 rounded-xl border border-white/10 overflow-hidden group">
            <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 text-white/60 hover:text-white transition-all duration-300 transform group-hover:scale-110">
                <div className="p-5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md shadow-2xl group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                    <Video className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center">
                    <span className="block text-sm font-black tracking-tight uppercase">{isRtl ? 'مشاهدة الفيديو' : 'View External Video'}</span>
                    <span className="block text-[10px] opacity-50 font-bold mt-1 max-w-[180px] truncate">{url}</span>
                </div>
            </a>
        </div>
    );
}
