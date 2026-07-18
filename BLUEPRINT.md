# ManageBac Clone — Product Blueprint

Compiled from a full walkthrough of the live ManageBac instance at hia.managebac.com (Hilal International Academy — an IB continuum school running PYP, MYP and DP). Detailed raw findings are in [notes/exploration-notes.md](notes/exploration-notes.md).

---

## 1. What ManageBac is

ManageBac is a **curriculum-first learning platform** for international schools. Unlike a generic LMS, everything hangs off the school's **programmes** (IB PYP/MYP/DP/CP, Cambridge, Edexcel, AP, national curricula). Each programme brings its own subjects, assessment rules, grade scales, report formats, and special components (CAS, Personal Project, Exhibition, Extended Essay, TOK).

Its five pillars:

1. **Academics** — classes, units (curriculum planning), tasks (assessment), gradebooks, term grades.
2. **Cohorts** — year groups (one per graduating class per programme) carrying programme-wide components: CAS/SA/SL trackers, project supervision (EE/TOK/PP/CP), subject plans.
3. **Reporting** — proofing/review workflow → templated report card generation (web + PDF) → transcripts.
4. **Community** — discussions, class streams, groups, Parents Association, calendar, files, notifications, portfolios.
5. **Administration** — school settings, user directory (5 roles), permissions, imports/exports, integrations, year rollover.

---

## 2. Roles & access model

| Role | Access |
|---|---|
| **Admin** | Everything incl. /settings; can act as teacher |
| **Teacher/Advisor** | Classes they teach, homeroom students, YGs; admin sub-rights granted per-domain (see below) |
| **Student** | Own classes, YG, portfolio, CAS/projects worksheets, tasks/deadlines |
| **Parent** | Linked children's progress, Parents Association, reports |
| **Observer** | Read-only guest role |

**Granular teacher permissions** (school default + per-user override), each with tiers (Full / limited / None):
Classes admin, Activity Groups admin, Reports (Full / Proofing-only / None), Student Directory (Full / Read-only / None), Engagement Analytics (All / Own classes+homeroom / None), Behaviour Notes (All / Homeroom / None), Academic Analytics, eCoursework Dashboard (All / Homeroom / None), AI features (Writing Assistant, AI Assistant).

**General security settings**: block student/parent login until date, reCAPTCHA, weak-password toggles, lock student/parent profile editing, lock approved activities, restrict student thread creation per context, lock Parents Association, additional homeroom advisors (max 10, attendance-only), online presence indicator, malware scan of uploads.

---

## 3. Core data model (entities & relationships)

```
School (tenant, subdomain)
├── Programmes (enabled from catalogue: IB DP/CP/MYP/PYP, Cambridge×3, Edexcel×3, AP, National×3)
│   ├── GradeLevels (Pre-K2…G12 mapped to programmes via matrix)
│   ├── AcademicYears → Terms (per programme; e.g. Semester 1/2 with dates; one "current")
│   ├── Subjects (per-programme catalogue + custom; grouped: DP groups 1-6+Core, MYP 8 groups+Core, PYP)
│   ├── AssessmentConfig (types, categories/weights, models, grade scales, MYP criteria+final grade boundaries)
│   ├── UnitPlannerTemplate (configurable sections/fields per programme)
│   ├── PBLTemplates (EE, TOK Essay/Exhibition, PP, CP, IDU…)
│   └── ReportTemplates (multi-curricula + legacy PDF)
├── Users (Student / Teacher / Parent / Observer / Admin)
│   ├── Student ⟷ Parents (linked), StudentID, grade, archived flag
│   └── Teacher: job functions, subjects taught, permission overrides
├── YearGroups (cohort: programme + grade + graduation year)
│   ├── memberships: students, homeroom advisors, CAS/SA/PP advisors
│   ├── ActivityWorksheets (CAS/SA/SL per student: experiences, outcomes, reflections, interviews)
│   ├── ProjectInstances (from PBL templates; per student: goals, journal, docs, meetings, criteria grades)
│   ├── DP Plans (subject choice worksheet per student)
│   └── discussions, calendar/deadlines, files, announcement
├── Classes (subject + grade + section + term links + teachers + students)
│   ├── Units (from planner template; lessons, resources, reflections)
│   ├── Tasks (type, category, criteria/points, due date, linked unit)
│   │   ├── Submissions (dropbox: files, status EARLY/LATE/WAITING, annotations)
│   │   └── Grades (points, criteria levels, comments)
│   ├── TermGrades (per student: criteria → final grade → local equivalent, ATL ratings, comment)
│   ├── ClassStream posts, discussions, calendar, files, members
│   └── settings (lock membership, discussions, archive)
├── Groups (clubs etc.) + ParentsAssociation (built-in)
├── Portfolios (per student: timeline of evidence + submissions, goals, files)
├── BehaviourNotes (typed, positive flag, next steps)
├── Reports (generated: term + template + cohort → web/PDF per student, scheduled release, parent notify)
└── Notifications (web/email/push × category + digests)
```

Key relationship: **Student → YearGroup** determines programme context, report template, and which core components (CAS vs SA vs SL, PP vs EE) apply. **Student → Classes** drives gradebook, tasks, timetable. Grade level is a property that must stay in sync with YG (policy setting: match/preserve on YG switch).

---

## 4. Module-by-module functional spec

### 4.1 Shell & navigation
- Left collapsible menu: My Workspace, Portfolio, Year Group(s), Classes, Groups, Insights, Explore (+ Settings for admins).
- Top bar: global search (hotkey `/`, entity-type filters), Quick Add, notifications dropdown (with AI summary), settings gear, help, profile menu.
- Dashboard: customisable widgets (Daily Calendar, Reviews & Progress queue, Recent Searches, Tasks & Deadlines) + Quick Actions.
- Right sidebar: AI chat bot, pinned items. Auto-logout with 5-min warning. Timezone-mismatch banner.
- Theming: 5 colour themes, custom logos (login/nav/print), landing page choice, login backgrounds, full terminology renaming, multi-language UI + AI translations.

### 4.2 Classes
- Roster with filters (programme/grade/subject-group/teacher/term) + cards showing counts (students, units, tasks, updates).
- Class page tabs: Overview (activity feed + bulletin), Class Stream (content posts; per-student view; timeline), Tasks & Units, Gradebook, Discussions, Calendar, Files, Members (students/teachers), Settings.
- **Units**: list/weekly/calendar views; unit = full curriculum plan (sections per programme template — inquiry, concepts, objectives, ATL, assessment, differentiation, reflections); draft/active; At-a-Glance summary view; Stream & Resources; linked assessments.
- **Tasks**: type (Summative/Formative/custom), category (Exam, Paper… with weights), assessment model (observation/binary/points/criteria), due + submission-open dates, dropbox (per-student status, annotation of files, ZIP download, lock, extend due date), resources, discussions per task.
- **Gradebook**: (a) Tasks grid — students × tasks, inline points+criteria entry, auto-save, export; (b) Term Grades — per student criteria levels → computed final grade (MYP 1–7 + local equivalent) with ATL skill ratings and rich-text comments (AI-assist); per-term via term selector.
- Class settings: name/section/class ID, bulletin, membership locking, discussions toggle, archive/delete. Immutable after creation: grade, linked terms, language, subject.

### 4.3 Year Groups
- Tabs: Overview, programme components (DP: Plans, CAS, TOK Exhibition, TOK Essay, EE | MYP: SA, PP, CP, IDU | PYP: SL, Exhibition), Discussions, Calendar, Files, Members.
- Members: students, homeroom teacher(s), per-component advisors; QuickStart checklist for setup.
- **Activity trackers (CAS/SA/SL)**: per-student worksheet (experiences, learning outcomes, reflections & evidence, interviews); advisor grouping; status chips (Excellent/On-track/Concern/TBD); lock worksheets; school-configurable outcomes, questions & guidance text; supervisor reviews; auto-complete rule.
- **Projects (PBL)**: template-driven (proposal → workspace → assessment); student workspace = goals, journal, to-dos, documents, notes/interview log, supervisor meetings; assessment per criteria (e.g. PP A/B/C 0–8); grouped-by-supervisor dashboards; "new changes" flags.
- YG settings: name/grade/graduation year, bulletin, CAS config (outcomes, hours, questions), attached PBL templates, discussions, citation tool, archive.

### 4.4 Groups & community
- Generic Groups (clubs/activities) with Overview/Discussions/Calendar/Files/Members — same chassis as YG minus academics; advisors; archive.
- Parents Association: built-in group for all parents; can be locked; parent @mentions optional.
- Discussions everywhere (class/YG/group) with school-level kill-switches, student thread-creation restrictions, @mentions with notifications.

### 4.5 Portfolio
- Per student, spanning programmes; teacher/advisor browse by grade → advisor/alphabetical.
- Timeline auto-collects coursework submissions (with early/late badge, files, annotations) + manually added Evidence of Learning (File/Website/Photo/Note types, configurable); Goals with guidance; comments, likes, learning connections; export timelines; feeds IB eCoursework status.

### 4.6 Homeroom & wellbeing
- Homeroom advisor: advisory comments per term (auto-save), term grade review, attendance (when timetable enabled).
- Behaviour & Discipline: school-defined behaviour types (positive/negative) + next steps; notes history with permission tiers; digests.

### 4.7 Reporting & analytics
- **Proofing & Review**: per programme+term, by subject / by student / reflections; lock term gradebook.
- **Report generation**: multi-curricula templates (from library or custom, can merge programmes), web+PDF output, naming/sort options, scheduled release, parent/student email notify, history, transcripts.
- **Engagement Analytics**: engagement buckets from task completion/lesson attendance/logins; reminder emails w/ template.
- **Academic Analytics**: achievement snapshot (Concern/On-Track/Excellent from configurable criteria + submission-behaviour scoring), grade distribution, workload charts, drill-down filters, AI assistant chat.
- **Curriculum analysis**: whole-school unit calendar; lenses (ATL, inquiry questions, standards, learner profile, differentiation…) for horizontal/vertical articulation.
- **eCoursework Dashboard**: DP IB submission tracking.

### 4.8 Administration
- **Directory**: 5 role rosters; search/sort/archive/delete; parent-child linking; bulk-edit grid; memberships two-pane bulk assigner (grade/homeroom filters → YGs/classes).
- **Imports**: CSV students/parents/teachers (create/update modes), photos, classes, class-assignments; OneRoster 1.2 zip import/export + history; Public API (OAuth2) + legacy tokens; SIS integrations.
- **Year rollover wizard** (6 steps): new terms → transition/archive YGs → transition classes (3 modes, carry-over options) → import classes → import students → assign to classes; progress-tracked checklist.
- **Per-programme config**: terms, subjects (+options/levels, EE subjects), assessment (types/categories/models/scales/criteria/final-grade boundaries), unit planner template fields, PBL templates, reflections questions, portfolio framework, academic-analytics thresholds, guides & handbooks (CAS/EE/TOK…).
- **Integrations marketplace**: AssessPrep, Turnitin, Google/Microsoft SSO + Drive/OneDrive, Google Classroom (Edlink), Clever, Zoom, BridgeU, SchoolsBuddy, iSAMS, Veracross, OpenApply, Pamoja…

### 4.9 Notifications
- Channel matrix (web/email/mobile push) × ~25 event categories grouped by module; digest frequencies (none/daily/weekly); AI unread summary; mention notifications.

---

## 5. What to build first (suggested MVP path)

**Phase 1 — Foundation**: multi-tenant school + programmes + grade levels + academic years/terms; users & roles; directory; year groups; classes (create/import); memberships.

**Phase 2 — Teaching core**: tasks + categories + assessment models + grade scales; dropbox submissions; gradebook (task grid + term grades); class stream/files/calendar; student & parent portals.

**Phase 3 — IB differentiators**: unit planner (templated per programme); CAS/SA/SL worksheets; PBL projects (EE/PP) with supervisor workflow; portfolio.

**Phase 4 — Reporting & polish**: proofing → report templates → PDF/web reports; analytics dashboards; notifications matrix; discussions/mentions; behaviour notes; permissions granularity; imports/OneRoster/API; year rollover wizard.

---

## 6. Notable design details worth copying

- **Auto-save everywhere** in grading surfaces (explicit "Auto-Save" reassurance banner).
- **QuickStart checklists** with time estimates and progress % on every empty entity (class, YG, reports, year rollover).
- **Immutability rules** communicated at creation time (grade/term/subject locked after class creation).
- **Status-chip language** reused across modules: Excellent / On-track / Concern / TBD; EARLY / LATE / WAITING.
- **Everything renameable** (terminology settings) and per-programme configurable — schools differ wildly.
- **Rich text with AI assist** in every long-form field; guidance text configurable by school and shown inline to students.
- **Archive-don't-delete** as default lifecycle for classes, YGs, users, units.
- Class/YG/Group share one "container" chassis (overview + stream/discussions + calendar + files + members) with module add-ons — big implementation win.
