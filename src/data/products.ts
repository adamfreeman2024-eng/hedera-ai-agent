export interface Product {
  id: string;
  name: string;
  priceInHbar: number;
  description: string;
  category: string;
}

export const products: Product[] = [
  {
    id: "prod-aurora-headphones",
    name: "Aurora Wireless Headphones",
    priceInHbar: 12.5,
    description: "Noise-cancelling over-ear headphones with 32-hour battery life.",
    category: "Audio",
  },
  {
    id: "prod-lumen-keyboard",
    name: "Lumen Mechanical Keyboard",
    priceInHbar: 8.75,
    description: "Low-profile mechanical switches with per-key RGB and USB-C.",
    category: "Peripherals",
  },
  {
    id: "prod-vertex-monitor",
    name: "Vertex 27\" 4K Monitor",
    priceInHbar: 45,
    description: "IPS panel, 144Hz, HDR400 — ideal for design and development.",
    category: "Displays",
  },
  {
    id: "prod-nexus-dock",
    name: "Nexus USB-C Dock",
    priceInHbar: 6.25,
    description: "12-in-1 hub with dual HDMI, 1GbE, and 100W pass-through charging.",
    category: "Accessories",
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}
