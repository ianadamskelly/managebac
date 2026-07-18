// Unit planner section templates per programme (mirrors ManageBac's
// configurable unit planner; fixed in code for now).

export type UnitSection = { key: string; title: string; hint?: string };
export type UnitSectionGroup = { title: string; sections: UnitSection[] };

const MYP_TEMPLATE: UnitSectionGroup[] = [
  {
    title: "Inquiry: establishing the purpose of the unit",
    sections: [
      { key: "key_concepts", title: "Key Concepts", hint: "e.g. Systems, Relationships" },
      { key: "related_concepts", title: "Related Concepts" },
      { key: "conceptual_understanding", title: "Conceptual Understanding" },
      { key: "global_context", title: "Global Context", hint: "Context and explorations to develop" },
      { key: "statement_of_inquiry", title: "Statement of Inquiry" },
      { key: "inquiry_questions", title: "Inquiry Questions", hint: "Factual, conceptual and debatable questions" },
    ],
  },
  {
    title: "Curriculum",
    sections: [
      { key: "objectives", title: "MYP Subject Group Objectives", hint: "Criteria strands assessed in this unit" },
      { key: "content", title: "Content (topics, knowledge, skills)" },
      { key: "atl_skills", title: "Approaches to Learning (ATL) Skills" },
      { key: "learner_profile", title: "Learner Profile" },
    ],
  },
  {
    title: "Assessment & learning experiences",
    sections: [
      { key: "formative_assessment", title: "Formative Assessment" },
      { key: "summative_assessment", title: "Summative Assessment" },
      { key: "learning_experiences", title: "Learning Experiences & Teaching Strategies" },
      { key: "differentiation", title: "Differentiation" },
      { key: "resources", title: "Support Materials & Resources" },
    ],
  },
  {
    title: "Reflections & evaluation",
    sections: [
      { key: "reflection_before", title: "Prior to teaching the unit" },
      { key: "reflection_during", title: "During teaching" },
      { key: "reflection_after", title: "After teaching the unit" },
    ],
  },
];

const DP_TEMPLATE: UnitSectionGroup[] = [
  {
    title: "Inquiry & purpose",
    sections: [
      { key: "transfer_goals", title: "Transfer Goals" },
      { key: "essential_understandings", title: "Essential Understandings" },
      { key: "guiding_questions", title: "Guiding Questions" },
      { key: "misconceptions", title: "Missed Concepts / Misunderstandings" },
    ],
  },
  {
    title: "Curriculum",
    sections: [
      { key: "aims", title: "Aims" },
      { key: "objectives", title: "Objectives" },
      { key: "syllabus_content", title: "Syllabus Content" },
      { key: "atl_skills", title: "Approaches to Learning (ATL) Skills" },
      { key: "international_mindedness", title: "International Mindedness" },
      { key: "tok_connections", title: "TOK Connections" },
      { key: "cas_connections", title: "CAS Connections" },
    ],
  },
  {
    title: "Assessment & learning experiences",
    sections: [
      { key: "formative_assessment", title: "Formative Assessment" },
      { key: "summative_assessment", title: "Summative Assessment" },
      { key: "learning_experiences", title: "Learning Experiences & Teaching Strategies" },
      { key: "differentiation", title: "Differentiation" },
      { key: "resources", title: "Support Materials & Resources" },
    ],
  },
  {
    title: "Reflections & evaluation",
    sections: [
      { key: "reflection_what_worked", title: "What worked well" },
      { key: "reflection_what_didnt", title: "What didn't work well" },
      { key: "reflection_notes", title: "Notes & changes for next time" },
    ],
  },
];

const PYP_TEMPLATE: UnitSectionGroup[] = [
  {
    title: "Inquiry",
    sections: [
      { key: "transdisciplinary_theme", title: "Transdisciplinary Theme", hint: "e.g. Who we are, How the world works" },
      { key: "central_idea", title: "Central Idea" },
      { key: "lines_of_inquiry", title: "Lines of Inquiry" },
      { key: "key_concepts", title: "Key Concepts" },
      { key: "learner_profile", title: "Learner Profile" },
    ],
  },
  {
    title: "Learning & teaching",
    sections: [
      { key: "learning_goals", title: "Learning Goals & Success Criteria" },
      { key: "learning_experiences", title: "Designing Engaging Learning Experiences" },
      { key: "atl_skills", title: "Approaches to Learning (ATL) Skills" },
      { key: "action", title: "Student Action" },
      { key: "resources", title: "Resources" },
    ],
  },
  {
    title: "Assessment & reflection",
    sections: [
      { key: "assessment", title: "Assessment" },
      { key: "reflection", title: "Teacher Reflections" },
    ],
  },
];

export function unitTemplate(programmeCode: string): UnitSectionGroup[] {
  if (programmeCode === "myp") return MYP_TEMPLATE;
  if (programmeCode === "diploma") return DP_TEMPLATE;
  if (programmeCode === "pyp") return PYP_TEMPLATE;
  return MYP_TEMPLATE;
}
