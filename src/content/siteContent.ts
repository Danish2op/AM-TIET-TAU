export type InfrastructureItem = {
  title: string;
  eyebrow: string;
  summary: string;
  image: string;
  alt: string;
  specs: string[];
};

export const siteContent = {
  centreName: "Centre of Excellence in Advanced Manufacturing",
  eyebrow: "TIET-TAU",
  heroTitle: "Advanced manufacturing capability, from material to validated component.",
  heroSummary:
    "A collaborative initiative between Thapar Institute of Engineering and Technology, Patiala, and Tel Aviv University, Israel, built for high-impact research, industry translation, training, prototyping, consultancy, and technology development.",
  contact: {
    email: "coeam@thapar.edu",
    address:
      "Thapar Institute of Engineering & Technology, Patiala-147004, Punjab, India"
  },
  capabilityStrip: [
    "Directed Energy Deposition",
    "Wire EDM",
    "Materials Characterization",
    "Post-Processing",
    "Industry Training",
    "Consultancy"
  ],
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
        "Achievable tolerance of ±2–5 microns",
        "Surface finish up to approximately 0.8 µm Ra",
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
    "Additive manufacturing process optimization",
    "High-performance metals, alloys, ceramics, composites, polymers, and FGMs",
    "Functionally graded and multi-material systems",
    "Surface engineering, repair, cladding, and near-net shape manufacturing",
    "Advanced machining, micro-features, and dimensional accuracy studies",
    "Industry 4.0 monitoring, analytics, and intelligent decision-making"
  ],
  industryOfferings: [
    "Process development and optimization",
    "Prototype development and pilot production",
    "Material and component qualification",
    "Hybrid manufacturing solutions",
    "Industry-focused DED and Wire EDM training",
    "Sponsored R&D and consultancy projects"
  ],
  leadership: [
    {
      name: "Prof. Noam Eliaz",
      role: "Founding Director & Chair Professor",
      affiliation:
        "Dean, The Iby and Aladar Fleischman Faculty of Engineering, Tel Aviv University, Israel"
    },
    {
      name: "Prof. Bhaskar Chandra Mohanty",
      role: "Joint-Director",
      affiliation:
        "Department of Physics & Materials Science, Thapar Institute of Engineering and Technology, Patiala"
    },
    {
      name: "Dr. Vineet Srivastava",
      role: "Joint-Director",
      affiliation:
        "Mechanical Engineering Department, Thapar Institute of Engineering and Technology, Patiala"
    }
  ]
};
