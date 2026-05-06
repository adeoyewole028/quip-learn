export interface CommunityQuestionSummary {
  id: number;
  authorId?: number | string;
  title: string;
  excerpt: string;
  tags: string[];
  author: string;
  role: string;
  asked: string;
  votes: number;
  answers: number;
  views: number;
  hasAcceptedAnswer?: boolean;
  trending?: boolean;
}

export interface CommunityAnswer {
  id: number;
  authorId?: number | string;
  author: string;
  role: string;
  posted: string;
  votes: number;
  accepted?: boolean;
  body: string[];
}

export interface CommunityThreadDetail {
  id: number;
  authorId?: number | string;
  title: string;
  excerpt: string;
  body: string[];
  tags: string[];
  author: string;
  role: string;
  asked: string;
  updated: string;
  votes: number;
  answerCount: number;
  views: number;
  hasAcceptedAnswer?: boolean;
  trending?: boolean;
  answers: CommunityAnswer[];
  relatedQuestionIds: number[];
  relatedQuestions?: CommunityQuestionSummary[];
}

export interface CommunityQuestionDraft {
  title: string;
  summary: string;
  details: string;
  whatTried: string;
  tags: string[];
  audience: string;
}

export const hotTags = ['operations', 'biomed', 'compliance', 'clinical-education', 'cohorts'];

export const communityThreads: CommunityThreadDetail[] = [
  {
    id: 1,
    title: 'Best way to document cold-chain exceptions during deliveries?',
    excerpt:
      'Our team logs temperature excursions in two places today. How are other healthcare operations teams keeping the handoff audit trail clean without duplicating work?',
    body: [
      'We currently capture a cold-chain excursion on the dispatch sheet and then ask a supervisor to re-enter the same incident in a separate tracker. It keeps the compliance record clean, but the duplicate entry slows shift handovers and makes it hard to spot the final source of truth.',
      'I am looking for a workflow that preserves timestamps, owner, and escalation steps while reducing repeated manual entry for riders, dispatchers, and QA reviewers.',
      'If you have a template, escalation checklist, or audit approach that worked in a live facility, I would like to compare notes.',
    ],
    tags: ['operations', 'cold-chain', 'compliance'],
    author: 'Ada N.',
    role: 'Operations Lead',
    asked: '12 mins ago',
    updated: '5 mins ago',
    votes: 18,
    answerCount: 2,
    views: 142,
    hasAcceptedAnswer: true,
    trending: true,
    answers: [
      {
        id: 101,
        author: 'Femi T.',
        role: 'Quality Assurance Manager',
        posted: '7 mins ago',
        votes: 12,
        accepted: true,
        body: [
          'Move the first record to the operational system and let every later step append metadata instead of creating a new row. In practice, that means the dispatcher opens the incident once, QA adds the corrective-action section, and the system keeps the audit history.',
          'We reduced duplicate entry by making the escalation form reference the original trip ID. The review team still gets the fields they need, but nobody rewrites the same narrative twice.',
        ],
      },
      {
        id: 102,
        author: 'Chioma K.',
        role: 'Dispatch Supervisor',
        posted: '3 mins ago',
        votes: 8,
        body: [
          'If the tooling cannot append to one source of truth yet, a halfway fix is to generate the QA entry from the first log automatically. That at least removes the second manual step and keeps the trip owner attached to every follow-up action.',
        ],
      },
    ],
    relatedQuestionIds: [3, 5, 4],
  },
  {
    id: 2,
    title: 'How do you explain ECG artifacts to first-time trainees?',
    excerpt:
      'I am preparing a quick internal training and need a simple analogy for motion artifacts versus true rhythm changes. Looking for explanations that work for new clinicians.',
    body: [
      'New trainees often see a noisy strip and assume it is a clinical emergency. I need a simple way to explain why patient movement, loose leads, or electrical interference can create dramatic-looking lines that are not actually rhythm changes.',
      'If you teach this topic, what analogy or quick demonstration helps the idea stick during an orientation session?',
    ],
    tags: ['training', 'ecg', 'clinical-education'],
    author: 'Bolu A.',
    role: 'Clinical Trainer',
    asked: '34 mins ago',
    updated: '18 mins ago',
    votes: 9,
    answerCount: 2,
    views: 87,
    trending: true,
    answers: [
      {
        id: 201,
        author: 'Lekan S.',
        role: 'Emergency Nurse Educator',
        posted: '20 mins ago',
        votes: 7,
        accepted: true,
        body: [
          'I tell trainees to imagine taking a long-exposure photo. If the subject moves, the camera records motion blur even though the person did not suddenly change shape. ECG artifacts are the monitor version of motion blur.',
        ],
      },
      {
        id: 202,
        author: 'Dara O.',
        role: 'Cardiac Technician',
        posted: '11 mins ago',
        votes: 4,
        body: [
          'A fast demo helps. I record one clean strip, then ask a learner to wiggle a lead cable slightly so they can compare both outputs side by side. They remember the difference much faster when they see the artifact happen live.',
        ],
      },
    ],
    relatedQuestionIds: [4, 1, 3],
  },
  {
    id: 3,
    title: 'Checklist for receiving donated ultrasound equipment?',
    excerpt:
      'We have a facility receiving refurbished scanners next week. What checks should happen before we sign off on readiness and user training?',
    body: [
      'A partner facility is receiving refurbished ultrasound scanners, and I want to make sure we do more than just power-on testing. We need a receiving checklist that covers accessories, maintenance history, calibration, and a minimum staff orientation before clinical use.',
      'If you have a handover checklist or sign-off sequence that works well, please share the critical steps.',
    ],
    tags: ['equipment', 'quality-assurance', 'biomed'],
    author: 'Tosin E.',
    role: 'Biomedical Engineer',
    asked: '2 hours ago',
    updated: '1 hour ago',
    votes: 14,
    answerCount: 0,
    views: 63,
    answers: [],
    relatedQuestionIds: [1, 5, 2],
  },
  {
    id: 4,
    title: 'What metrics matter most for lesson completion in cohort-based learning?',
    excerpt:
      'I can track starts, completions, and quiz scores. Which signals actually help you spot learners who need support before they disengage?',
    body: [
      'We already track starts, completions, and quiz scores, but those three numbers are not enough to tell which learners are about to drop off. I need earlier warning signs so facilitators can intervene before people stop showing up entirely.',
      'What engagement metrics or cohort patterns have actually changed how you follow up with learners?',
    ],
    tags: ['analytics', 'cohorts', 'learning-design'],
    author: 'Ife M.',
    role: 'Learning Designer',
    asked: 'Yesterday',
    updated: '6 hours ago',
    votes: 11,
    answerCount: 2,
    views: 96,
    hasAcceptedAnswer: true,
    answers: [
      {
        id: 401,
        author: 'Kemi A.',
        role: 'Program Analyst',
        posted: '10 hours ago',
        votes: 9,
        accepted: true,
        body: [
          'The strongest early warning for us was time-to-second-lesson. Learners who started but did not reach lesson two within a fixed window almost always needed outreach. That signal arrived earlier than final quiz performance.',
        ],
      },
      {
        id: 402,
        author: 'Tunde J.',
        role: 'Facilitator',
        posted: '8 hours ago',
        votes: 5,
        body: [
          'I also track how long someone spends between opening a lesson and attempting the first quiz. Long delays can mean confusion, poor connectivity, or workload pressure. It gives the facilitator a better conversation starter than simply saying completion is low.',
        ],
      },
    ],
    relatedQuestionIds: [2, 1, 5],
  },
  {
    id: 5,
    title: 'How should we prepare staff for a high-stakes blood transport simulation?',
    excerpt:
      'Need ideas for running a realistic tabletop or timed practical that tests escalation, packaging, and communication without overwhelming newer team members.',
    body: [
      'We want to run a simulation for blood transport teams that tests packaging, communication, and escalation under time pressure. The difficulty is making the exercise realistic without turning it into pure chaos for newer team members.',
      'If you have a structure for staging the scenario, observer notes, and debrief questions, I would appreciate a sample.',
    ],
    tags: ['simulation', 'operations', 'team-training'],
    author: 'Mariam O.',
    role: 'Program Manager',
    asked: '2 days ago',
    updated: '1 day ago',
    votes: 7,
    answerCount: 1,
    views: 58,
    answers: [
      {
        id: 501,
        author: 'Victor N.',
        role: 'Emergency Logistics Coach',
        posted: '1 day ago',
        votes: 6,
        body: [
          'Break the exercise into visible phases: dispatch brief, packaging, en-route disruption, and receiving handoff. Newer participants stay grounded because they can see the scenario arc, while observers still get enough pressure points to evaluate communication quality.',
        ],
      },
    ],
    relatedQuestionIds: [1, 3, 4],
  },
];

export const communityQuestions: CommunityQuestionSummary[] = communityThreads.map((thread) => ({
  id: thread.id,
  title: thread.title,
  excerpt: thread.excerpt,
  tags: thread.tags,
  author: thread.author,
  role: thread.role,
  asked: thread.asked,
  votes: thread.votes,
  answers: thread.answerCount,
  views: thread.views,
  hasAcceptedAnswer: thread.hasAcceptedAnswer,
  trending: thread.trending,
}));

export function getCommunityThreadById(questionId: number): CommunityThreadDetail | undefined {
  return communityThreads.find((thread) => thread.id === questionId);
}

export function getRelatedCommunityQuestions(questionIds: number[]): CommunityQuestionSummary[] {
  return questionIds
    .map((questionId) => communityQuestions.find((question) => question.id === questionId))
    .filter((question): question is CommunityQuestionSummary => Boolean(question));
}