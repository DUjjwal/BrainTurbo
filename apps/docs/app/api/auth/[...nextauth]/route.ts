import NextAuth ,{Account, Session} from "next-auth"
import { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google"

const fn =  NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        })
    ],
    session: {
        strategy: "jwt"
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        jwt: async ({ token, account}: { token: JWT, account: Account | null}) => {
            if(account) {
                token.idToken = account.id_token;
            }
            return token;
        },
        session: ({session, token}:{session: Session, token: JWT}) => {
            //@ts-ignore
            session.user.idToken = token.idToken; // Expose to client
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