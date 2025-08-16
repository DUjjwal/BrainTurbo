import NextAuth ,{Session} from "next-auth"
import { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google"

const fn =  NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        jwt: async ({ token}: { token: JWT}) => {
            return token;
        },
        session: ({session}:{session: Session}) => {
            return session
        },
        async signIn() {
            return true        
        },
        async redirect({ baseUrl }) {
            return `${baseUrl}/room`;
        },
    },
    pages: {
        signIn: "/"
    }
})

export {fn as GET, fn as POST}