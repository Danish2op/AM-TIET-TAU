export type InfrastructureItem = {
  title: string;
  eyebrow: string;
  summary: string;
  image: string;
  alt: string;
  specs: string[];
};

export type NavigationItem = {
  label: string;
  path: string;
  summary: string;
};

export type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
  tag: string;
};

export type ResearchArea = {
  title: string;
  summary: string;
};

export type IndustryOffering = {
  title: string;
  summary: string;
};

export type PartnerLogo = {
  name: string;
  src: string;
  alt: string;
};

export const siteContent = {
  centreName: "Centre of Excellence in Advanced Manufacturing",
  eyebrow: "TIET-TAU",
  tagline: "Engineered precision, smarter tomorrow.",
  contact: {
    email: "coeam@thapar.edu",
    website: "https://am.thapar.edu/",
    address:
      "Thapar Institute of Engineering & Technology, Patiala-147004, Punjab, India"
  },
  aboutCentre: [
    "The Centre of Excellence in Advanced Manufacturing (CoE-AM) is a dedicated platform established to promote innovation, high-impact research, and technology-driven transformation in modern manufacturing domains. The Centre is a collaborative initiative between Thapar Institute of Engineering and Technology (TIET), Patiala, and Tel Aviv University (TAU), Israel. It is led by the founding Director and Chair Professor, Prof. Noam Eliaz. It serves as a multidisciplinary ecosystem where cutting-edge infrastructure and expert researchers converge to provide specialised support to academia, industry, defense organizations, healthcare institutions, etc. In particular, the Centre aims to facilitate end-to-end technology development from conceptual design and simulation to prototyping, testing, refinement, and final validation. Its research thrust areas include additive manufacturing process optimization, development of high-performance materials, including metals and alloys, ceramics, composites, functionally graded materials (FGMs), multi-material systems, and polymers, for advanced applications; novel innovations in welding, casting, and forming techniques; surface engineering; advanced machining strategies; hybrid manufacturing approaches; and deployment of Industry 4.0 tools for real-time monitoring and intelligent decision-making. Through such initiatives, the Centre seeks to drive improvements in manufacturing efficiency, product reliability, and sustainability.",
    "Beyond research, CoE-AM is committed to creating a highly capable and industry-ready workforce and bridging the skills gap by offering specialized training, certifications, and hands-on workshops for students and professionals. It also serves as a vital incubator for entrepreneurs, providing the prototyping tools and expert consultancy necessary to transform ideas into market-ready products. The Centre encourages innovation-driven entrepreneurship by collaborative projects, and consultancy services, thereby strengthening the industry-academia-innovation chain. Ultimately, the CoE-AM is envisioned as a powerful catalyst for economic and technological growth, fostering a highly skilled workforce and a robust innovation ecosystem that strengthens global industrial competitiveness."
  ],
  directorMessage: {
    heading: "Message from Director, CoE-AM",
    // Placeholder copy — replace with the Director's actual message before launch.
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    ]
  },
  partnerLogos: [
    {
      name: "Thapar Institute of Engineering and Technology",
      src: "/assets/tiet-logo.png",
      alt: "Thapar Institute of Engineering and Technology official logo"
    },
    {
      name: "Tel Aviv University",
      src: "/assets/tau-logo.png",
      alt: "Tel Aviv University official logo"
    }
  ] satisfies PartnerLogo[],
  navigation: [
    {
      label: "Home",
      path: "/",
      summary: "Compact overview of CoE-AM capabilities and collaboration routes."
    },
    {
      label: "Facilities",
      path: "/facilities",
      summary: "DED, Wire EDM, validation labs, metrology, and finishing support."
    },
    {
      label: "Research",
      path: "/research",
      summary: "Materials, process optimization, repair, precision machining, and Industry 4.0."
    },
    {
      label: "Industry",
      path: "/industry",
      summary: "Training, prototyping, qualification, sponsored R&D, and consultancy."
    },
    {
      label: "Gallery",
      path: "/gallery",
      summary: "Facility and material images in a compact interactive gallery."
    },
    {
      label: "Contact",
      path: "/contact",
      summary: "Primary collaboration email and institute address."
    }
  ] satisfies NavigationItem[],
  coreInfrastructure: [
    {
      eyebrow: "Metal additive manufacturing",
      title: "India's first InssTek Directed Energy Deposition MX-Fab3 5-axis system",
      summary:
        "A powder-fed DED platform for multi-axis deposition, repair, cladding, multimaterial builds, and complex geometries.",
      image: "/assets/ded-system.webp",
      alt: "InssTek MX-Fab3 Directed Energy Deposition system at the centre",
      specs: [
        "2 kW fiber laser",
        "Powder-fed DED",
        "XYZ travel of 800 x 1000 x 700 mm",
        "Controlled inert atmosphere",
        "Six powder feeders and hoppers",
        "Hybrid manufacturing compatibility"
      ]
    },
    {
      eyebrow: "Precision machining",
      title: "CNC Wire Cut EDM for high-precision conductive materials",
      summary:
        "A precision Wire EDM system for complex contour cutting, micro-feature machining studies, and repeatable production work.",
      image: "/assets/wire-edm.webp",
      alt: "CNC Wire EDM system in the centre facility",
      specs: [
        "Wire diameter of 0.1-0.25 mm",
        "Achievable tolerance of +/-2-5 microns",
        "Surface finish up to approximately 0.8 micrometers Ra",
        "Hardened tool steels, superalloys, carbides, and conductive composites"
      ]
    },
    {
      eyebrow: "Validation ecosystem",
      title: "Materials characterization, testing, metrology, and finishing support",
      summary:
        "Complementary infrastructure connects fabrication with inspection, testing, post-processing, and dimensional validation.",
      image: "/assets/printed-component.webp",
      alt: "Additively manufactured metal component produced through advanced manufacturing",
      specs: [
        "SEM, TEM, EBSD, XRD, Raman, XPS, EDS, and ICP-OES support",
        "Tensile, fatigue, hardness, and impact testing",
        "CMM and 3D laser scanning",
        "Thermal treatment, sand blasting, and chemical polishing"
      ]
    }
  ] satisfies InfrastructureItem[],
  researchAreas: [
    {
      title: "Additive manufacturing process optimization",
      summary:
        "Laser power, powder delivery, toolpath, atmosphere, and build strategy studies for repeatable DED outcomes."
    },
    {
      title: "High-performance material systems",
      summary:
        "Metals, alloys, ceramics, composites, polymers, and functionally graded materials for advanced applications."
    },
    {
      title: "Functionally graded and multi-material systems",
      summary:
        "Composition transitions and multi-feed deposition routes for parts that need location-specific performance."
    },
    {
      title: "Repair, cladding, and surface engineering",
      summary:
        "Near-net shape restoration, wear-resistant surfaces, and component repair workflows for high-value parts."
    },
    {
      title: "Precision machining and dimensional accuracy",
      summary:
        "Wire EDM, micro-feature machining, metrology, and finishing studies for validated component geometry."
    },
    {
      title: "Industry 4.0 monitoring and analytics",
      summary:
        "Process data, monitoring, analytics, and intelligent decision-making for advanced manufacturing workflows."
    }
  ] satisfies ResearchArea[],
  industryOfferings: [
    {
      title: "Process development and optimization",
      summary:
        "Define manufacturable parameter windows for DED, Wire EDM, post-processing, and validation workflows."
    },
    {
      title: "Prototype development and pilot production",
      summary:
        "Move from concept geometry to trial components, iteration builds, and small-batch demonstrators."
    },
    {
      title: "Material and component qualification",
      summary:
        "Connect fabrication with testing, metrology, surface evaluation, and documentation for decision-ready results."
    },
    {
      title: "Hybrid manufacturing solutions",
      summary:
        "Combine additive deposition, subtractive machining, finishing, and inspection around one component problem."
    },
    {
      title: "DED and Wire EDM training",
      summary:
        "Hands-on training modules for students, researchers, engineers, and industry teams working with advanced systems."
    },
    {
      title: "Sponsored R&D and consultancy projects",
      summary:
        "Structured collaboration for materials, process studies, component repair, product development, and technical advice."
    }
  ] satisfies IndustryOffering[],
  gallery: [
    {
      src: "/assets/ded-system.webp",
      alt: "Exterior view of the InssTek MX-Fab3 Directed Energy Deposition system",
      caption: "InssTek MX-Fab3 5-axis Directed Energy Deposition system used for metal additive manufacturing.",
      tag: "DED system"
    },
    {
      src: "/assets/ded-process.webp",
      alt: "Directed Energy Deposition work area and process setup",
      caption: "DED work area supporting multi-axis deposition, cladding, repair, and complex geometry builds.",
      tag: "Process setup"
    },
    {
      src: "/assets/wire-edm.webp",
      alt: "CNC Wire EDM equipment in the centre",
      caption: "CNC Wire Cut EDM system for complex contour cutting and high-precision conductive materials.",
      tag: "Wire EDM"
    },
    {
      src: "/assets/printed-component.webp",
      alt: "Additively manufactured metal vessel-like component",
      caption: "Printed metal component showing layer-built manufacturing outcomes and component-scale capability.",
      tag: "AM component"
    },
    {
      src: "/assets/sample-coupons.webp",
      alt: "Advanced manufacturing sample coupons with different finishes",
      caption: "Sample coupons and material surfaces used to communicate process and finishing outcomes.",
      tag: "Samples"
    },
    {
      src: "/assets/demo-component.webp",
      alt: "Demonstration component shown with a technical display",
      caption: "Demonstration part and display setup used for capability communication and gallery context.",
      tag: "Demo part"
    }
  ] satisfies GalleryItem[]
};
