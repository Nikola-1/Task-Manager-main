'use client';

import type { RefObject } from 'react';
import HelpTaskIntro from '@/components/ui/HelpTaskIntro/HelpTaskIntro';

interface StarFieldProps {
  titleLocation: RefObject<HTMLHeadingElement | null>;
}

export default function StarField({ titleLocation }: StarFieldProps) {
  return <HelpTaskIntro targetRef={titleLocation} />;
}
