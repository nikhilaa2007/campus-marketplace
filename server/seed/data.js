export const SEED_DOMAIN = 'seed.test';
export const SEED_PASSWORD = 'Password@123';
export const COLLEGE = 'PVPSIT';

export const USERS = [
  { name: 'Ravi Teja', email: `ravi@${SEED_DOMAIN}`, branch: 'CSE', year: 3 },
  { name: 'Priya Sharma', email: `priya@${SEED_DOMAIN}`, branch: 'ECE', year: 3 },
  { name: 'Anil Kumar', email: `anil@${SEED_DOMAIN}`, branch: 'Mechanical', year: 4 },
  { name: 'Sneha Reddy', email: `sneha@${SEED_DOMAIN}`, branch: 'IT', year: 2 },
  { name: 'Karthik Varma', email: `karthik@${SEED_DOMAIN}`, branch: 'EEE', year: 2 },
];

// owner = index in USERS. deal = optional demo request (buyer = index in USERS)
export const ITEMS = [
  // ---- Ravi (CSE) ----
  { owner: 0, title: 'Data Structures Using C', category: 'textbooks', condition: 'like-new', type: 'sell', price: 180, brand: 'Reema Thareja', yearOfPurchase: 2025, originalPrice: 450, description: 'Clean copy with no highlighting. Covers the full second year data structures syllabus.', deal: { status: 'completed', buyer: 1 } },
  { owner: 0, title: 'Operating System Concepts', category: 'textbooks', condition: 'good', type: 'sell', price: 320, brand: 'Silberschatz, Galvin', yearOfPurchase: 2024, originalPrice: 700 },
  { owner: 0, title: 'Database System Concepts', category: 'textbooks', condition: 'good', type: 'sell', price: 350, brand: 'Silberschatz, Korth, Sudarshan', yearOfPurchase: 2024, originalPrice: 750 },
  { owner: 0, title: 'Computer Networks', category: 'textbooks', condition: 'like-new', type: 'sell', price: 300, brand: 'Andrew S. Tanenbaum', yearOfPurchase: 2025, originalPrice: 650 },
  { owner: 0, title: 'Data Structures notes with previous year question papers', category: 'textbooks', condition: 'good', type: 'giveaway', description: 'Handwritten unit-wise notes plus the last five years of question papers for CSE second year.' },

  // ---- Priya (ECE) ----
  { owner: 1, title: 'Digital Design', category: 'textbooks', condition: 'good', type: 'sell', price: 200, brand: 'M. Morris Mano', originalPrice: 450 },
  { owner: 1, title: 'Fundamentals of Electric Circuits', category: 'textbooks', condition: 'like-new', type: 'sell', price: 380, brand: 'Alexander, Sadiku', originalPrice: 800 },
  { owner: 1, title: 'Arduino Uno starter kit', category: 'electronics', condition: 'good', type: 'sell', price: 900, yearOfPurchase: 2025, originalPrice: 1800, description: 'Uno board, breadboard, sensors, LEDs and jumper wires. All parts tested and working.', deal: { status: 'pending', buyer: 0 } },
  { owner: 1, title: 'Breadboard and jumper wire set', category: 'electronics', condition: 'new', type: 'sell', price: 120, description: 'Unused, still in the packet.' },
  { owner: 1, title: 'Digital Electronics handwritten notes', category: 'textbooks', condition: 'good', type: 'giveaway', description: 'Unit-wise notes for the full syllabus. Free for juniors.' },

  // ---- Anil (Mechanical) ----
  { owner: 2, title: 'A Textbook of Strength of Materials', category: 'textbooks', condition: 'good', type: 'sell', price: 250, brand: 'R.K. Bansal', originalPrice: 550 },
  { owner: 2, title: 'Engineering Thermodynamics', category: 'textbooks', condition: 'good', type: 'sell', price: 300, brand: 'P.K. Nag', originalPrice: 650 },
  { owner: 2, title: 'Engineering Graphics', category: 'textbooks', condition: 'good', type: 'sell', price: 220, brand: 'N.D. Bhatt', originalPrice: 500 },
  { owner: 2, title: 'Lab coat (size M)', category: 'lab-equipment', condition: 'good', type: 'sell', price: 150, description: 'White lab coat, washed and ironed.' },
  { owner: 2, title: 'Digital multimeter', category: 'lab-equipment', condition: 'like-new', type: 'sell', price: 400, brand: 'Mastech', yearOfPurchase: 2025, deal: { status: 'accepted', buyer: 3 } },
  { owner: 2, title: 'Mini drafter', category: 'stationery', condition: 'good', type: 'sell', price: 200, description: 'Used for Engineering Drawing in the first year. Moves smoothly, scale is intact.' },

  // ---- Sneha (IT) ----
  { owner: 3, title: 'Higher Engineering Mathematics', category: 'textbooks', condition: 'good', type: 'sell', price: 280, brand: 'B.S. Grewal', originalPrice: 650 },
  { owner: 3, title: 'Engineering Physics', category: 'textbooks', condition: 'good', type: 'sell', price: 150, brand: 'Gaur and Gupta', originalPrice: 350 },
  { owner: 3, title: 'Engineering Chemistry', category: 'textbooks', condition: 'good', type: 'sell', price: 140, brand: 'Jain and Jain', originalPrice: 320 },
  { owner: 3, title: 'Casio fx-991ES Plus calculator', category: 'electronics', condition: 'like-new', type: 'sell', price: 700, brand: 'Casio', yearOfPurchase: 2025, originalPrice: 1000, description: 'Allowed in university exams. Comes with the cover.' },
  { owner: 3, title: 'Physics lab manual', category: 'textbooks', condition: 'good', type: 'giveaway', description: 'First year physics lab manual with all experiments.' },
  { owner: 3, title: 'Engineering Chemistry handwritten notes', category: 'textbooks', condition: 'good', type: 'giveaway', description: 'Complete notes for the first year course. Free for juniors.' },

  // ---- Karthik (EEE) ----
  { owner: 4, title: 'Casio fx-82MS calculator', category: 'electronics', condition: 'good', type: 'sell', price: 450, brand: 'Casio', yearOfPurchase: 2024 },
  { owner: 4, title: 'Lab coat (size S)', category: 'lab-equipment', condition: 'good', type: 'sell', price: 130 },
  { owner: 4, title: 'Soldering iron 40W', category: 'lab-equipment', condition: 'good', type: 'sell', price: 250, brand: 'Goot' },
  { owner: 4, title: 'Engineering drawing set', category: 'stationery', condition: 'like-new', type: 'sell', price: 120, description: 'Compass, divider and set squares. Barely used.' },
];

// background colour of the placeholder photo, per category
export const CATEGORY_COLOR = {
  textbooks: '1f3a8a', electronics: '0f766e', 'lab-equipment': '6d28d9',
  stationery: 'b45309', 'study-essentials': '475569',
};
