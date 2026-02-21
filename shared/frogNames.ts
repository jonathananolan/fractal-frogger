// Random frog names for mobile players

export const FROG_NAMES = [
  'Ribbit Rick',
  'Hoppy',
  'Sir Croaks',
  'Lily Pad',
  'Bog Boss',
  'Swamp Thing',
  'Toad Warrior',
  'Frogzilla',
  'Leap Lord',
  'Pond Prince',
  'Marsh Mallow',
  'Croak Master',
  'Jumpy Jeff',
  'Splashy',
  'Webfoot',
  'Green Bean',
  'Tadpole',
  'Frogsworth',
  'Hopper',
  'Slick Frog',
];

export function getRandomFrogName(): string {
  return FROG_NAMES[Math.floor(Math.random() * FROG_NAMES.length)];
}
