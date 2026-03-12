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
        if (req.nextUrl.pathname.startsWith("/admin") && token?.role !== "ADMIN" && token?.role !== "MARKETING_MANAGER") {
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
    matcher: ["/admin/:path*", "/am/:path*", "/client/:path*", "/moderator/:path*", "/login", "/messages", "/notifications", "/tasks"],
};
