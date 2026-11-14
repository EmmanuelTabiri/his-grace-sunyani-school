import classroom from '@/assets/classroom.jpg';
import science from '@/assets/science.jpg';
import sports from '@/assets/sports.jpg';
import welcome from '@/assets/school-welcome.jpg';

export type PublicImage = {
  src: string;
  alt: string;
  caption?: string;
  category?: string;
  illustrative: boolean;
};

/*
 * Replace illustrative website imagery here, one entry at a time.
 * When supplying a real school photograph, set illustrative to false and update
 * its alt text and caption to describe that confirmed photograph accurately.
 * Owner-supplied gallery photographs remain separate in gallery-images.ts.
 */
export const publicImages = {
  homeHero: {
    src: welcome,
    alt: 'Illustrative image of a Ghanaian teacher helping pupils with their work; not a photograph of His Grace Academy',
    illustrative: true,
  },
  aboutClassroom: {
    src: classroom,
    alt: 'Illustrative image of a Ghanaian classroom with pupils taking part in a lesson; not a photograph of His Grace Academy',
    illustrative: true,
  },
} satisfies Record<string, PublicImage>;

export const schoolImages: PublicImage[] = [
  { src: classroom, category: 'Learning', caption: 'Curiosity in the classroom', alt: 'Illustrative image of Ghanaian pupils raising their hands during a lesson; not a photograph of His Grace Academy', illustrative: true },
  { src: science, category: 'Discovery', caption: 'Exploring through science', alt: 'Illustrative image of Ghanaian students working with science equipment; not a photograph of His Grace Academy', illustrative: true },
  { src: sports, category: 'Togetherness', caption: 'Room to play and grow', alt: 'Illustrative image of Ghanaian pupils playing football; not a photograph of His Grace Academy', illustrative: true },
];

export const learningStages = [
  { title: 'Early years', detail: 'Enquire about nursery and kindergarten places.', number: '01' },
  { title: 'Primary', detail: 'Enquire about primary classes and subject options.', number: '02' },
  { title: 'Junior high', detail: 'Enquire about junior high places and learning support.', number: '03' },
];
