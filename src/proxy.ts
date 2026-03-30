import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isAuthPage = req.nextUrl.pathname.startsWith("/login");

        if (isAuthPage) {
            if (isAuth) {
                // If authenticated and trying to access login, send to root to let RootPage handle redirection
                return NextResponse.redirect(new URL("/", req.url));
            }
            return null;
        }

        if (!isAuth) {
            let from = req.nextUrl.pathname;
            if (req.nextUrl.search) {
                from += req.nextUrl.search;
            }
            return NextResponse.redirect(
                new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
            );
        }

        // Role-based protection
        if (req.nextUrl.pathname.startsWith("/admin/meetings") && token?.role === "CLIENT") {
            return NextResponse.redirect(new URL("/", req.url));
        } else if (req.nextUrl.pathname.startsWith("/admin") && !req.nextUrl.pathname.startsWith("/admin/meetings") && token?.role !== "ADMIN" && token?.role !== "MARKETING_MANAGER") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (req.nextUrl.pathname.startsWith("/am") && token?.role !== "AM" && token?.role !== "ADMIN" && token?.role !== "MARKETING_MANAGER") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (req.nextUrl.pathname.startsWith("/client") && token?.role !== "CLIENT" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (req.nextUrl.pathname.startsWith("/moderator") && token?.role !== "MODERATOR" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        
        // HR Protection
        if (req.nextUrl.pathname.startsWith("/hr-manager") && token?.role !== "HR_MANAGER" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }

        // Teams Protection
        if (req.nextUrl.pathname.startsWith("/seo-team") && token?.role !== "SEO_TEAM" && token?.role !== "SEO_LEAD" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (req.nextUrl.pathname.startsWith("/seo-lead") && token?.role !== "SEO_LEAD" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        
        if (req.nextUrl.pathname.startsWith("/content-team") && token?.role !== "CONTENT_TEAM" && token?.role !== "CONTENT_LEADER" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (req.nextUrl.pathname.startsWith("/content-leader") && token?.role !== "CONTENT_LEADER" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }

        if (req.nextUrl.pathname.startsWith("/art-team") && token?.role !== "ART_TEAM" && token?.role !== "ART_LEADER" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (req.nextUrl.pathname.startsWith("/art-leader") && token?.role !== "ART_LEADER" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }
    },
    {
        callbacks: {
            authorized() {
                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        "/admin/:path*", "/am/:path*", "/client/:path*", "/moderator/:path*", 
        "/hr-manager/:path*", "/seo-team/:path*", "/seo-lead/:path*", 
        "/content-team/:path*", "/content-leader/:path*", "/art-team/:path*", "/art-leader/:path*",
        "/login", "/messages", "/notifications", "/tasks"
    ],
};
