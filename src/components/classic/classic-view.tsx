import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { ProjectsSection } from "@/components/projects-section";
import { Journey } from "@/components/journey";
import { OffWorldPark } from "@/components/off-world-park";
import { ContactSection } from "@/components/classic/contact-section";
import { Footer } from "@/components/footer";

/** The classic portfolio — fast, accessible, read-only view of src/content/.
 * Rendered at both `/` and `/classic` until Phase 2 builds the voxel world. */
export function ClassicView() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProjectsSection />
        <Journey />
        <OffWorldPark />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
