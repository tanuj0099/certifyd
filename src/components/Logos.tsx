"use client";

import LogoLoop from "./reactbits/LogoLoop";

const vendors = [
  { name: "Google", src: "/logos/google.svg", width: 110 },
  { name: "AWS", src: "/logos/aws.svg", width: 60 },
  { name: "Microsoft", src: "/logos/microsoft.svg", width: 150 },
  { name: "Cisco", src: "https://cdn.simpleicons.org/cisco/1BA0D7", width: 65 },
  { name: "PMI", src: "https://upload.wikimedia.org/wikipedia/commons/2/29/PMI_Logo_2019.svg", width: 110 },
  { name: "ISC2", src: "https://upload.wikimedia.org/wikipedia/commons/d/df/ISC2_Logo.svg", width: 100 },
  { name: "CompTIA", src: "https://cdn.simpleicons.org/comptia/ED1B24", width: 140 },
  { name: "Oracle", src: "https://cdn.simpleicons.org/oracle/F80000", width: 120 },
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
          renderItem={(item: any) => (
            <div className="flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-target h-[36px]">
              <img 
                src={item.src} 
                alt={item.name} 
                className="object-contain"
                style={{ height: '36px', width: item.width ? `${item.width}px` : 'auto', maxHeight: '36px', minWidth: item.width ? `${item.width}px` : 'auto' }}
              />
            </div>
          )}
        />
      </div>
    </section>
  );
}
