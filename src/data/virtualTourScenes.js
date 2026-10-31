const commonsFile = (file) =>
  `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(" ", "_"))}`;
const imagePath = `${import.meta.env.BASE_URL}images/virtual-tour/`;

export const virtualTourScenes = [
  {
    id: "living-room",
    name: "Living Room",
    label: "غرفة المعيشة",
    panorama: `${imagePath}living-room.jpg`,
    attribution: "ESO — Guesthouse living room, CC BY 4.0",
    attributionUrl: commonsFile("Guesthouse living room (gh-livingroom-pan).jpg"),
    hotspots: [
      { pitch: -6, yaw: 35, targetSceneId: "bedroom", label: "إلى غرفة النوم" },
      { pitch: -8, yaw: -70, targetSceneId: "kitchen", label: "إلى المطبخ" },
      { pitch: -4, yaw: 155, targetSceneId: "balcony", label: "إلى الشرفة" },
    ],
  },
  {
    id: "bedroom",
    name: "Bedroom",
    label: "غرفة النوم",
    panorama: `${imagePath}bedroom.jpg`,
    attribution: "NPS Photo — Mrs. Sandburg's Bedroom, Public domain",
    attributionUrl: commonsFile("360 view of Mrs. Sandburg's Bedroom (2a47eada-2d4c-4c54-8bce-8fe81c56e617).jpg"),
    hotspots: [
      { pitch: -7, yaw: -95, targetSceneId: "living-room", label: "العودة إلى غرفة المعيشة" },
      { pitch: -8, yaw: 65, targetSceneId: "kitchen", label: "إلى المطبخ" },
    ],
  },
  {
    id: "kitchen",
    name: "Kitchen",
    label: "المطبخ",
    panorama: `${imagePath}kitchen.jpg`,
    attribution: "NPS Photo — Sandburg Home Kitchen, Public domain",
    attributionUrl: commonsFile("360 view of the Sandburg Home Kitchen (d0da8053-8da5-4c70-8e49-281c084900ec).jpg"),
    hotspots: [
      { pitch: -8, yaw: 130, targetSceneId: "living-room", label: "إلى غرفة المعيشة" },
      { pitch: -6, yaw: -110, targetSceneId: "balcony", label: "إلى الشرفة" },
    ],
  },
  {
    id: "balcony",
    name: "Balcony",
    label: "الشرفة",
    panorama: `${imagePath}balcony.jpg`,
    attribution: "Greg Zaal via Poly Haven, CC0",
    attributionUrl: commonsFile("Illovo beach balcony 24k – Panorama (Greg Zaal via Poly Haven).jpg"),
    hotspots: [
      { pitch: -8, yaw: -85, targetSceneId: "living-room", label: "العودة إلى غرفة المعيشة" },
    ],
  },
];
