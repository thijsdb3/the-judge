import HomeBody from "@/components/homebody/HomeBody"


export default function Home() {
  return (
    <HomeBody/> // if more code gets into homebody consider splitting components to avoid sequential data fetching
  );
}
