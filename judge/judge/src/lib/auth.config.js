 const authConfig ={
  
    providers : [],
    callbacks:{
        async jwt({token,user}){
            if(user){
                token.id = user.id;
                token.username =user.username
            }
            return token;
        },
        async session({session,token}){
            if (token){
                session.user.username = token.username;
                session.user.id = token.id;
               
            }
            return session;
        },
    
        authorized({auth,request}){
            const user = auth?.user;
            const isOnLoginPage = request.nextUrl?.pathname.startsWith("/login");
            if(isOnLoginPage && user){
                return Response.redirect(new URL("/",request.nextUrl))
            }
            return true;

        },
    }
}
export default authConfig