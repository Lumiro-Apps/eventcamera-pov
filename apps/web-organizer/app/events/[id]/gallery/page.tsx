import { OrganizerGalleryApp } from '../../../../src/OrganizerGalleryApp';

interface OrganizerGalleryPageProps {
  params: {
    id: string;
  };
}

export default function OrganizerGalleryPage({ params }: OrganizerGalleryPageProps) {
  return <OrganizerGalleryApp eventId={params.id} />;
}
