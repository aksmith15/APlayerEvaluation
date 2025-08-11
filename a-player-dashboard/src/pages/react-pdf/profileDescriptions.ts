/**
 * Profile Descriptions Data
 * NOTE: Populate these maps with the complete set of combinations.
 * Fallback messaging will be used if a combination is missing.
 */

export type GradeCombo3 = 'A,A,A' | string; // 4^3 combinations
export type GradeCombo4 = 'A,A,A,A' | string; // 4^4 combinations

export interface ProfileDescriptions {
  competence: Record<GradeCombo3, string>;
  character: Record<GradeCombo3, string>;
  curiosity: Record<GradeCombo4, string>;
}

export const profileDescriptions: ProfileDescriptions = {
  competence: {
    'A,A,A': "{{evaluatee}} demonstrates exceptional professional competence across all dimensions. They consistently deliver outstanding work that exceeds expectations while never missing deadlines or commitments. Their full ownership of both successes and failures makes them a trusted cornerstone of the team. This rare combination of excellence in execution and character makes them invaluable to the organization.",
    'A,A,B': "{{evaluatee}} produces exceptional work with unwavering reliability, consistently delivering high-quality outputs on schedule. While they generally take responsibility for their actions and outcomes, they may occasionally need prompting to fully acknowledge mistakes or address difficult situations head-on. Their technical excellence and dependability largely compensate for these minor accountability gaps. With slight improvement in ownership, they would be a truly exceptional performer.",
    'B,A,B': "{{evaluatee}} maintains consistent reliability with good work quality and generally solid accountability. They deliver on schedule without fail, producing work that meets expectations and taking responsibility for most outcomes. While they may occasionally need encouragement to fully own challenging situations, their dependability makes them valuable. They represent solid, professional performance that teams can build upon.",
    // TODO: Add remaining 61 combinations for competence
  },
  character: {
    'A,A,A': "{{evaluatee}} is an exceptional cultural leader who transforms team dynamics through their presence. They inspire others with compelling vision, communicate with remarkable clarity and persuasion, and elevate team performance through outstanding collaboration. Their ability to unite people around common goals while fostering individual growth makes them invaluable to organizational culture. They represent the gold standard for interpersonal effectiveness and cultural contribution.",
    'B,A,B': "{{evaluatee}} communicates exceptionally well with good leadership and teamwork abilities. Their ability to articulate complex ideas clearly, combined with solid collaborative skills and leadership potential, makes them a valuable cultural asset. They facilitate understanding and maintain positive team relationships while showing good judgment. With slightly stronger teamwork and leadership presence, they would be exceptional.",
    'B,B,B': "{{evaluatee}} demonstrates consistent and balanced interpersonal competence across all character dimensions. They show solid leadership, communicate effectively, and collaborate well with others, making them a reliable cultural contributor. While not exceptional in any single area, their well-rounded interpersonal skills make them a stable, positive presence. They represent the dependable middle ground that creates consistent team culture.",
    // TODO: Add remaining 61 combinations for character
  },
  curiosity: {
    'A,A,A,A': "{{evaluatee}} exemplifies exceptional growth mindset and innovation across all dimensions. They continuously seek improvement opportunities, adapt brilliantly to any change or challenge, solve complex problems with creative solutions, and proactively drive initiatives without prompting. Their combination of learning agility, flexibility, analytical excellence, and self-direction makes them an invaluable innovation engine for the organization. They represent the ideal of intellectual curiosity and professional growth.",
    'A,A,A,B': "{{evaluatee}} demonstrates exceptional learning agility with outstanding problem-solving capabilities. They excel at continuous improvement, adapt seamlessly to change, and develop creative solutions to complex challenges, while showing strong but not exceptional initiative. Their growth mindset and analytical abilities are exemplary, though they could be even more proactive in identifying and pursuing opportunities. With slightly more self-direction, they would be perfect innovators.",
    'B,B,B,B': "{{evaluatee}} demonstrates consistent and balanced good performance across all curiosity dimensions. They maintain solid continuous improvement, adapt reasonably to change, solve problems effectively, and show good initiative. This well-rounded profile makes them reliable contributors to innovation and organizational evolution. They represent steady, dependable intellectual curiosity.",
    // TODO: Add remaining 253 combinations for curiosity
  }
};

export const DEFAULT_MISSING_PROFILE_MESSAGE =
  'Performance profile pending review. Please contact HR for detailed assessment.';

