import Hero from "@/components/sections/Hero";
import Shows from "@/components/sections/Shows";
import Music from "@/components/sections/Music";
import Footer from "@/components/sections/Footer";
import MusicFooterShell from "@/components/gsap/MusicFooterShell";

export default function Home() {
  return (
    <main className="relative" style={{ backgroundColor: "#c8cbc8" }} >
      <Hero />
      <Music />



      <MusicFooterShell>
        <Shows />
        <Footer />
      </MusicFooterShell>
    </main>
  );
}
