import { GuestExperience } from '../../../src/guest/GuestExperience';

interface GuestEventPageProps {
  params: {
    slug: string;
  };
}

export default function GuestEventPage({ params }: GuestEventPageProps) {
  return <GuestExperience slug={params.slug} />;
}
