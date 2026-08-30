"use client";

import Image from "next/image";
import LogoLoop from "./reactbits/LogoLoop";

const vendors = [
  { name: "Google", src: "/logos/google.svg" },
  { name: "AWS", src: "/logos/aws.svg" },
  { name: "Microsoft", src: "/logos/microsoft.svg" },
  { name: "Cisco", src: "https://cdn.simpleicons.org/cisco/1BA0D7" },
  { name: "ISC2", src: "https://cdn.simpleicons.org/isc2/D93B30" },
  { name: "CompTIA", src: "https://cdn.simpleicons.org/comptia/ED1B24" },
  { name: "PMI", src: "https://cdn.simpleicons.org/pmi/253992" },
];

export default function Logos() {
  return (
    <section className="py-12 bg-background border-b border-border overflow-hidden">
      <div className="container mx-auto px-4 text-center mb-8">
        <p className="text-sm font-medium text-text-secondary uppercase tracking-widest">
          Supported Certifications
        </p>
      </div>
      
      <div className="w-full relative py-4 flex items-center group">
        <LogoLoop 
          logos={vendors} 
          pauseOnHover={true}
          speed={60}
          logoHeight={36}
          gap={80}
          renderItem={(item) => (
            <div className="flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-target h-[36px]">
              <Image 
                src={item.src} 
                alt={item.name} 
                width={120} 
                height={36} 
                className="object-contain w-auto h-full"
              />
            </div>
          )}
        />
      </div>
    </section>
  );
}
