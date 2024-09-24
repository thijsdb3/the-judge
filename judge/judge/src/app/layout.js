import NavBar from "@/components/navbar/Navbar";
import "./globals.css";
import Footer from "@/components/footer/Footer";


export const metadata = {
  title: "The Judge",
  description: "Fun new board game",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="">
        <NavBar/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
