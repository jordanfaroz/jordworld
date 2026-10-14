import { ContactForm } from "@/components/contact-form";

export function ContactSection() {
  return (
    <section id="contact" className="mx-auto max-w-lg px-4 py-20">
      <h2 className="font-heading text-foreground mb-6 text-2xl">Contact</h2>
      <ContactForm />
    </section>
  );
}
