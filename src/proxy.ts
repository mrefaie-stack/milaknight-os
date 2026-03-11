import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isAuthPage = req.nextUrl.pathname.startsWith("/login");

        if (isAuthPage) {
            if (isAuth) {
                if (token.role === "ADMIN") {
                    return NextResponse.redirect(new URL("/admin", req.url));
                } else if (token.role === "AM") {
                    return NextResponse.redirect(new URL("/am", req.url));
                } else if (token.role === "MODERATOR") {
                    return NextResponse.redirect(new URL("/moderator", req.url));
                } else {
                    return NextResponse.redirect(new URL("/client", req.url));
                }
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
        if (req.nextUrl.pathname.startsWith("/admin") && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        if (req.nextUrl.pathname.startsWith("/am") && token?.role !== "AM" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        if (req.nextUrl.pathname.startsWith("/client") && token?.role !== "CLIENT" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        if (req.nextUrl.pathname.startsWith("/moderator") && token?.role !== "MODERATOR" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/login", req.url));
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
    matcher: ["/admin/:path*", "/am/:path*", "/client/:path*", "/moderator/:path*", "/login", "/messages", "/notifications"],
};
