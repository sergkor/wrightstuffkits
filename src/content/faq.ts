export interface FaqItem {
  q: string;
  a: string;
}

export const faq: FaqItem[] = [
  { q: 'Where do you ship?', a: 'United States only. You choose USPS Ground Advantage or Priority Mail inside PayPal at checkout.' },
  { q: 'How long until my order ships?', a: 'Kits usually ship within 2 business days. Custom laser-cut propellers ship within 5 business days of receiving your design file.' },
  { q: 'Do the kits meet Science Olympiad rules?', a: 'All of our kits are designed to comply with Division C 2027 Flight rules. Always check the current rules manual and your event supervisor for the final word.' },
  { q: 'What tools do I need?', a: 'Super glue (CA), a hobby knife, spray adhesive, pliers, and a winder. These are not included in any kit.' },
  { q: 'How do I send my custom propeller design?', a: 'After paying, email the design (DXF preferred, or any image with a size) and your PayPal order ID to the address shown on the confirmation page.' },
  { q: 'What is your return policy?', a: 'Unopened kits can be returned within 30 days for a refund minus shipping. Custom propellers are made to order and cannot be returned. If anything arrives damaged, email us within 7 days with photos and we will replace it.' },
  { q: 'Do you charge sales tax?', a: 'Tax, where required, is calculated by PayPal at checkout.' },
];
