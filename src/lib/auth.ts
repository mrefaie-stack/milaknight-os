import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "email,public_profile,ads_read,read_insights,pages_show_list,pages_read_engagement,pages_manage_metadata,pages_read_user_content,business_management",
                    auth_type: "rerequest"
                },
            },
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user) {
                    throw new Error("User not found");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: `${user.firstName} ${user.lastName}`,
                };
            }
        })
    ],
    session: {
        strategy: "jwt"
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "facebook" && account.access_token) {
                const email = user.email?.toLowerCase();
                
                if (!email) {
                    console.error("Facebook login failed: No email provided by Facebook.");
                    return false;
                }

                console.log(`Attempting Facebook link for email: ${email}`);

                // 1. Try to find user by exact email match
                let dbUser = await (prisma as any).user.findFirst({
                    where: { 
                        email: {
                            equals: email,
                            mode: 'insensitive'
                        }
                    }
                });

                // 2. AGENCY FALLBACK: If no email match, and it's a Meta connection,
                // link it to the primary ADMIN so they can map it to clients.
                if (!dbUser) {
                    console.log(`No direct email match for ${email}. Finding primary Admin...`);
                    dbUser = await prisma.user.findFirst({
                        where: { role: 'ADMIN' },
                        orderBy: { createdAt: 'asc' }
                    });
                }

                if (dbUser) {
                    console.log(`Linking Meta account [${account.providerAccountId}] to user [${dbUser.email}]`);
                    await (prisma as any).socialConnection.upsert({
                        where: {
                            userId_platform_platformAccountId: {
                                userId: dbUser.id,
                                platform: "FACEBOOK",
                                platformAccountId: account.providerAccountId,
                            },
                        },
                        update: {
                            accessToken: account.access_token,
                            refreshToken: account.refresh_token,
                            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                        },
                        create: {
                            userId: dbUser.id,
                            platform: "FACEBOOK",
                            platformAccountId: account.providerAccountId,
                            accessToken: account.access_token,
                            refreshToken: account.refresh_token,
                            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                        },
                    });
                    // IMPORTANT: Return true to allow the sign-in to complete in NextAuth
                    return true;
                } else {
                    console.error(`Facebook login failed: No Admin user found to link connection.`);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                
                // If this is an OAuth login, we need to ensure the ID is our DB ID, not the provider ID
                if (account?.provider === 'facebook') {
                    const email = user.email?.toLowerCase();
                    let dbUser: any = null;
                    
                    if (email) {
                        dbUser = await (prisma as any).user.findFirst({
                            where: { 
                                email: {
                                    equals: email,
                                    mode: 'insensitive'
                                }
                            }
                        });
                    }

                    // AGENCY FALLBACK
                    if (!dbUser) {
                        dbUser = await (prisma as any).user.findFirst({
                            where: { role: 'ADMIN' },
                            orderBy: { createdAt: 'asc' }
                        });
                    }

                    if (dbUser) {
                        token.id = dbUser.id;
                        token.role = dbUser.role;
                    }
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
