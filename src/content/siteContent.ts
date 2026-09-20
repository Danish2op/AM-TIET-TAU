export type SpecRow = {
  label: string;
  value: string;
};

export type LabeledSpecItem = {
  label: string;
  description: string;
};

export type SpecGroup = {
  heading: string;
  // Plain phrases render as a compact multi-column bullet list. Labeled
  // items (bold label + description) render as a single-column divided
  // list instead, since the description text needs the full row width.
  items: string[] | LabeledSpecItem[];
};

export type InfrastructureItem = {
  title: string;
  eyebrow: string;
  summary: string;
  image: string;
  alt: string;
  specs: string[];
  // Structured card layout: a bold heading + a lighter model line replace
  // the eyebrow/title pair, and a label/value + grouped-list table replaces
  // the flat spec bullet list. Optional so cards can migrate one at a time.
  heading?: string;
  model?: string;
  specRows?: SpecRow[];
  specGroups?: SpecGroup[];
  link?: { label: string; href: string };
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

export type FocusArea = {
  title: string;
  summary: string;
};

export type PartnerLogo = {
  name: string;
  src: string;
  alt: string;
};

export type TeamMember = {
  name: string;
  role: string;
  affiliation: string;
  photo: string;
  photoAlt: string;
  linkedin: string;
  // No invented quotes for real, named people — only set when the person
  // has supplied their own words (currently just the director's message).
  note?: string;
};

export const siteContent = {
  centreName: "Centre of Excellence in Advanced Manufacturing",
  eyebrow: "TIET-TAU",
  tagline: "Engineered Precision, Smarter Tomorrow",
  contact: {
    email: "coeam@thapar.edu",
    website: "https://am.thapar.edu/",
    address:
      "Thapar Institute of Engineering & Technology, Patiala-147004, Punjab, India"
  },
  aboutCentre: {
    intro: [
      "The Centre of Excellence in Advanced Manufacturing (CoE-AM) is a flagship joint initiative of Thapar Institute of Engineering and Technology (TIET), Patiala, and Tel Aviv University (TAU), Israel. Founded under the leadership of Chair Professor Noam Eliaz, the Centre operates as an advanced multidisciplinary hub connecting academia, industry, defense, and healthcare.",
      "CoE-AM supports end-to-end technology development—guiding projects from conceptual design and simulation to prototyping, testing, refinement, and validation."
    ],
    focusHeading: "Core Research Focus Areas",
    focusAreas: [
      {
        title: "Advanced Additive & Hybrid Manufacturing",
        summary: "Process optimization and integrated hybrid techniques."
      },
      {
        title: "High-Performance Materials",
        summary:
          "Research into metals, alloys, ceramics, composites, functionally graded materials (FGMs), multi-material systems, and polymers."
      },
      {
        title: "Process Innovations",
        summary:
          "Advanced techniques in welding, casting, forming, surface engineering, and machining."
      },
      {
        title: "Industry 4.0 Integration",
        summary:
          "Real-time monitoring, smart automation, and intelligent decision-making systems to elevate production efficiency and sustainability."
      }
    ] satisfies FocusArea[],
    closing:
      "In addition to core research, CoE-AM acts as a talent engine and startup incubator. By hosting specialized certifications, hands-on technical workshops, and collaborative industry projects, the Centre actively bridges the skills gap while helping entrepreneurs turn innovative concepts into market-ready products."
  },
  directorMessage: {
    heading: "Message from Director",
    paragraphs: [
      "Welcome to the Centre of Excellence in Advanced Manufacturing (CoE-AM).",
      "Modern manufacturing is undergoing a profound shift, driven by breakthrough material science, smart automation, and unprecedented cross-disciplinary collaboration. Established through a partnership between Thapar Institute of Engineering and Technology and Tel Aviv University, CoE-AM was built to lead this transformation.",
      "Our mission is simple: bridging the gap between world-class academic research and real-world industrial impact. Whether optimizing additive manufacturing, engineering resilient materials, or integrating Industry 4.0 systems, our state-of-the-art facilities empower researchers, students, and industry partners to solve complex engineering challenges.",
      "Beyond technology development, we are deeply committed to nurturing talent and supporting entrepreneurs. Through our specialized training programs and incubation ecosystem, we aim to equip the next generation of engineers and innovators with the hands-on expertise needed to compete globally.",
      "I invite students, researchers, industry leaders, and visionaries to explore CoE-AM, collaborate with our team, and help us shape the future of advanced manufacturing."
    ],
    signatureName: "Prof. Noam Eliaz",
    signatureRole: "Founding Director and Chair Professor, CoE-AM",
    photo: "/assets/director.webp",
    photoAlt: "Prof. Noam Eliaz, Founding Director and Chair Professor of CoE-AM"
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
      label: "People",
      path: "/people",
      summary: "Faculty, researchers, and engineers who drive CoE-AM work."
    },
    {
      label: "Gallery",
      path: "/gallery",
      summary: "Facility and material images in a compact interactive gallery."
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
      ],
      heading: "5-Axis Directed Energy Deposition System",
      model: "Model: MX-Fab3, InssTek (South Korea)",
      specRows: [
        {
          label: "Laser Power",
          value: "2 kW fiber laser (high stability, industrial-grade)"
        },
        {
          label: "Deposition Type",
          value: "Powder-fed DED"
        },
        {
          label: "Build Capability",
          value:
            "Multi-axis deposition for complex geometries, XYZ travel of 800 x 1000 x 700 mm"
        }
      ] satisfies SpecRow[],
      specGroups: [
        {
          heading: "Examples of AM'ed Materials",
          items: [
            "Stainless steels (e.g., SS 316L, 304L, 420J2, H13)",
            "Nickel-based alloys (e.g., Inconel 625/718, INVAR 36, HASTELLOY 22)",
            "Titanium alloys (e.g., Ti-6Al-4V)",
            "Cobalt based alloys (e.g., Stellite 25, CoCr MP1)",
            "Tool steels & customized alloys",
            "Multimaterials",
            "Functionally graded materials (FGMs)",
            "Composites",
            "Repair"
          ]
        },
        {
          heading: "Features",
          items: [
            "Real-time process control",
            "Hybrid manufacturing compatibility",
            "Controlled inert atmosphere",
            "Six powder feeders and hoppers"
          ]
        }
      ] satisfies SpecGroup[]
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
      ],
      heading: "Wire EDM System",
      model: "Model: Ecocut, Electronica (India)",
      specRows: [
        {
          label: "Machine Type",
          value: "CNC Wire Cut EDM (High Precision)"
        },
        {
          label: "Wire Diameter",
          value: "0.1-0.25 mm"
        },
        {
          label: "Achievable Tolerance",
          value: "+/-2-5 microns"
        },
        {
          label: "Surface Finish",
          value: "Up to ~0.8 um Ra (multi-pass)"
        }
      ] satisfies SpecRow[],
      specGroups: [
        {
          heading: "Work Materials",
          items: [
            "Hardened tool steels",
            "Superalloys (Inconel, titanium)",
            "Carbides and conductive composites"
          ]
        },
        {
          heading: "Capabilities",
          items: [
            "Complex contour cutting",
            "Micro-feature machining",
            "High repeatability production"
          ]
        }
      ] satisfies SpecGroup[]
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
      ],
      heading: "Complementary Infrastructure",
      link: {
        label: "Visit the Material Characterization Facility (MCF-SPMS) site",
        href: "https://sites.google.com/thapar.edu/mcf-spms/home"
      },
      specGroups: [
        {
          heading: "Materials Characterization & Testing Labs",
          items: [
            {
              label: "Microscopy Suite",
              description:
                "Scanning electron microscopy (SEM), Transmission electron microscopy (TEM), Electron backscatter diffraction (EBSD) for grain structure analysis"
            },
            {
              label: "Phase analysis",
              description:
                "X-ray diffractometer (XRD), Raman spectroscopy, X-ray photoelectron spectroscopy (XPS)"
            },
            {
              label: "Compositional analysis",
              description:
                "Energy-dispersive X-ray spectroscopy (EDS), Inductively coupled plasma - optical emission spectroscopy (ICP-OES)"
            },
            {
              label: "Mechanical Testing",
              description:
                "Tensile, fatigue, hardness, and impact testing to validate part integrity"
            },
            {
              label: "Metrology Lab",
              description:
                "Precision measurement tools like CMM (Coordinate Measuring Machines) and 3D laser scanners to ensure dimensional accuracy"
            }
          ]
        },
        {
          heading: "Post-Processing & Finishing Zones",
          items: [
            {
              label: "Thermal Treatment",
              description: "Furnaces for stress-relieving, annealing, and age-hardening"
            },
            {
              label: "Surface Finishing",
              description:
                "Sand blaster and chemical polishing stations to achieve required surface roughness"
            }
          ]
        }
      ] satisfies SpecGroup[]
    }
  ] satisfies InfrastructureItem[],
  projects: [
    "Development of MAX-Phase Reinforced Metal Matrix Composites via Directed Energy Deposition for High-Performance Structural Applications",
    "Additive Manufacturing of High-Entropy Alloy Superconductors: Towards Mechanically Robust Next Generation Superconductors for Extreme Environments",
    "Experimental & Computational Design of Hybrid Additive-Thermomechanical Manufacturing Routes for Steel Heterostructures with Enhanced Strength–Ductility Synergy",
    "Development of cost-effective antimicrobial high-entropy alloys for infection-resistant biomedical dental implants via multi feeder directed energy deposition",
    "AI-Driven Design of Functionally Graded Patient-Specific Orthopaedic Implants from X-Ray Imaging Using Direct Energy Deposition",
    "Additive Manufacturing of Indigenous Bimetallic Cu–Cr–Hf–Nb / Inconel 718/625 Nozzles for Rocket Applications",
    "Grain Boundary Engineering of Additively Manufactured Materials Using Severe Plastic Deformation for High-Temperature Applications",
    "Functionally Graded Multi-Material Coatings for Low-Pressure Turbine Blades via Laser Directed Energy Deposition",
    "Experimental and Computational Study on the Tribo-Mechanical Performance of Defect-Engineered AM-Fabricated FGMs for Extreme Environments"
  ] satisfies string[],
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
  offeringGroups: [
    {
      heading: "Industry Offerings",
      items: [
        "Process development & optimization",
        "Precision manufacturing",
        "Material & component qualification",
        "Hybrid manufacturing solutions"
      ]
    },
    {
      heading: "Training & Collaboration",
      items: [
        "Industry-focused training programs (DED & Wire EDM)",
        "Sponsored R&D and consultancy projects",
        "Prototype development and pilot production"
      ]
    },
    {
      heading: "Specialized Capabilities",
      items: [
        "Functionally Graded Materials (FGMs) & multimaterials",
        "Near-net shape manufacturing",
        "Legacy part reconstruction",
        "Kerf width, surface roughness & dimensional accuracy studies"
      ]
    },
    {
      heading: "Value to Industry",
      items: [
        { label: "Cost Reduction", description: "Repair instead of replacement" },
        { label: "Reduced Lead Time", description: "Rapid prototyping & manufacturing" },
        { label: "High Precision", description: "Micron-level accuracy" },
        { label: "Material Efficiency", description: "Near-net shape fabrication" }
      ]
    }
  ] satisfies SpecGroup[],
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
  people: [
    {
      name: "Prof. Noam Eliaz",
      role: "Founding Director & Chair Professor, CoE-AM",
      affiliation: "Tel Aviv University",
      photo: "/assets/director.webp",
      photoAlt: "Prof. Noam Eliaz, Founding Director of CoE-AM",
      linkedin: "https://www.linkedin.com/in/noam-eliaz-3743a6b/"
    },
    // Principal Investigators (one per funded project).
    {
      name: "Satish Kumar Sharma",
      role: "Associate Professor, Department of Mechanical Engineering",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/satish-kumar-sharma.webp",
      photoAlt: "Satish Kumar Sharma, Associate Professor at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/dr-satish-kumar-sharma-0b88b669/"
    },
    {
      name: "Sourav Marik",
      role: "Associate Professor, DPMS",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/sourav-marik.webp",
      photoAlt: "Sourav Marik, Associate Professor at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/sourav-marik-910b4864/"
    },
    {
      name: "Vineet Srivastava",
      role: "Associate Professor & Joint Director, CoE-AM",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/vineet-srivastava.webp",
      photoAlt: "Vineet Srivastava, Associate Professor and Joint Director of CoE-AM",
      linkedin: "https://www.linkedin.com/in/vineet-srivastava-68b9aa10a/"
    },
    {
      name: "Gaurav Goel",
      role: "Associate Professor, SEE",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/gaurav-goel.webp",
      photoAlt: "Gaurav Goel, Associate Professor at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/dr-gaurav-goel-b548255/"
    },
    {
      name: "Vivek Jain",
      role: "Professor, Department of Mechanical Engineering",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/vivek-jain.webp",
      photoAlt: "Vivek Jain, Professor at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/vivek-jain-3594181b/"
    },
    {
      name: "Dheeraj Gupta",
      role: "Professor, Department of Mechanical Engineering",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/dheeraj-gupta.webp",
      photoAlt: "Dheeraj Gupta, Professor at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/dr-dheeraj-gupta-314b2b42/"
    },
    {
      name: "Prabhat Chand Yadav",
      role: "Assistant Professor, Department of Mechanical Engineering",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/prabhat-chand-yadav.webp",
      photoAlt: "Prabhat Chand Yadav, Assistant Professor at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/prabhat-chand-yadav-453b263a/"
    },
    {
      name: "Ravinder Singh Joshi",
      role: "Associate Professor",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/ravinder-singh-joshi.webp",
      photoAlt: "Ravinder Singh Joshi, Associate Professor at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/ravinder-singh-joshi-5611093b/"
    },
    {
      name: "Hiralal Bhowmick",
      role: "Professor",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/hiralal-bhowmick.webp",
      photoAlt: "Hiralal Bhowmick, Professor at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/hiralal-bhowmick-59b26b1b/"
    },
    // Co-Principal Investigators (TIET).
    {
      name: "Ajay Batish",
      role: "Pro Vice Chancellor & Chief Academic Officer",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/ajay-batish.webp",
      photoAlt: "Ajay Batish, Pro Vice Chancellor & Chief Academic Officer at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/ajay-batish-92060aa0/"
    },
    {
      name: "Diptiman Choudhury",
      role: "Associate Professor, Department of Chemistry & Biochemistry",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/diptiman-choudhury.webp",
      photoAlt: "Diptiman Choudhury, Associate Professor at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/diptiman-choudhury-ph-d-60882114/"
    },
    {
      name: "Malkeet Singh",
      role: "Assistant Professor / Scientist (PI)",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/malkeet-singh.webp",
      photoAlt: "Malkeet Singh, Assistant Professor at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/malkeet-singh-0029b2137/"
    },
    {
      name: "Tarunpreet Bhatia",
      role: "Associate Dean, Strategic Initiatives & Associate Professor, CSED",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/tarunpreet-bhatia.webp",
      photoAlt: "Tarunpreet Bhatia, Associate Professor at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/tarunpreet-bhatia30/"
    },
    {
      name: "P Kalyan Chakravarthy K",
      role: "Visiting Assistant Professor, Department of Mechanical Engineering",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/person-placeholder.svg",
      photoAlt: "P Kalyan Chakravarthy K, Visiting Assistant Professor at Thapar Institute of Engineering & Technology",
      linkedin: "#"
    },
    {
      name: "Ratnesh Kumar Raj Singh",
      role: "Associate Professor",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/ratnesh-kumar-raj-singh.webp",
      photoAlt: "Ratnesh Kumar Raj Singh, Associate Professor at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/dr-ratnesh-kumar-raj-singh-8905a633/"
    },
    {
      name: "Amritbir Singh",
      role: "Assistant Professor (Research)",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/amritbir-singh.webp",
      photoAlt: "Amritbir Singh, Assistant Professor (Research) at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/amritbir-singh-ph-d-692290176/"
    },
    {
      name: "Aaishwarika Sharma",
      role: "Co-PI, CoE-AM project",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/person-placeholder.svg",
      photoAlt: "Aaishwarika Sharma, Co-PI at Thapar Institute of Engineering & Technology",
      linkedin: "#"
    },
    {
      name: "Bhaskar Mohanty",
      role: "Faculty, DPMS",
      affiliation: "Thapar Institute of Engineering & Technology",
      photo: "/assets/people/bhaskar-mohanty.webp",
      photoAlt: "Bhaskar Mohanty, Faculty at Thapar Institute of Engineering & Technology",
      linkedin: "https://www.linkedin.com/in/bhaskar-mohanty/"
    },
    // External co-investigators and collaborators.
    {
      name: "Neha Shah",
      role: "Co-PI, CoE-AM project",
      affiliation: "GNIDSR, Kolkata",
      photo: "/assets/person-placeholder.svg",
      photoAlt: "Neha Shah, Co-PI at Guru Nanak Institute of Dental Sciences and Research, Kolkata",
      linkedin: "#"
    },
    {
      name: "Ankit Thakur",
      role: "Postdoctoral Research Fellow",
      affiliation: "Tel Aviv University, Israel",
      photo: "/assets/people/ankit-thakur.webp",
      photoAlt: "Ankit Thakur, Postdoctoral Research Fellow at Tel Aviv University",
      linkedin: "https://www.linkedin.com/in/ankit-thakur-4577aa66/"
    },
    {
      name: "Maxim Sokol",
      role: "Associate Professor",
      affiliation: "Tel Aviv University, Israel",
      photo: "/assets/people/maxim-sokol.webp",
      photoAlt: "Maxim Sokol, Associate Professor at Tel Aviv University",
      linkedin: "https://www.linkedin.com/in/maxim-sokol-b903511a8/"
    },
    {
      name: "Saurav Goel",
      role: "Professor of Manufacturing",
      affiliation: "London South Bank University, UK",
      photo: "/assets/people/saurav-goel.webp",
      photoAlt: "Saurav Goel, Professor of Manufacturing at London South Bank University",
      linkedin: "https://www.linkedin.com/in/sauravgoel/"
    },
    {
      name: "Francesco Travascio",
      role: "Associate Professor",
      affiliation: "University of Miami, USA",
      photo: "/assets/person-placeholder.svg",
      photoAlt: "Francesco Travascio, Associate Professor at University of Miami",
      linkedin: "https://www.linkedin.com/in/francesco-travascio-022b036b/"
    },
    {
      name: "Monsuru Ramoni",
      role: "Assistant Professor, Industrial, Manufacturing & Systems Engineering",
      affiliation: "University of Texas Rio Grande Valley, USA",
      photo: "/assets/person-placeholder.svg",
      photoAlt: "Monsuru Ramoni, Assistant Professor at the University of Texas Rio Grande Valley",
      linkedin: "#"
    },
    {
      name: "Yi Huang",
      role: "Associate Professor, Manufacturing and Materials Engineering",
      affiliation: "Bournemouth University, UK",
      photo: "/assets/people/yi-huang.webp",
      photoAlt: "Yi Huang, Associate Professor at Bournemouth University",
      linkedin: "https://www.linkedin.com/in/yi-huang-18523369/"
    },
    {
      name: "Colin Hall",
      role: "Industry Professor",
      affiliation: "Adelaide University, Australia",
      photo: "/assets/people/colin-hall.webp",
      photoAlt: "Colin Hall, Industry Professor at Adelaide University",
      linkedin: "https://www.linkedin.com/in/colinhallunisa/"
    },
    {
      name: "Tanmoy Mukhopadhyay",
      role: "Faculty, Programmable Matter Lab",
      affiliation: "University of Southampton, UK",
      photo: "/assets/people/tanmoy-mukhopadhyay.webp",
      photoAlt: "Tanmoy Mukhopadhyay, Faculty at the University of Southampton",
      linkedin: "https://www.linkedin.com/in/tanmoy-mukhopadhyay-0b6a7912/"
    }
  ] satisfies TeamMember[],
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
