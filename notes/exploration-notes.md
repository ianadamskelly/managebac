# ManageBac Exploration Notes (hia.managebac.com — Hilal International Academy)

Working notes gathered by walking the live site (teacher+admin account "Ian Kelly"). Raw material for the webapp blueprint.

## School context
- IB continuum school: PYP (KG2–Grade 5), MYP (Grade 6–10), DP (Grade 11–12).
- Year groups are cohort-based, named by graduating class ("IB Primary Years Class of 2036 (Grade 2)" ... "Class of 2025 (Grade 12)"). 14 active year groups.
- ManageBac is a Faria company product; SSO across Faria services (OpenApply, Atlas, SchoolsBuddy etc. likely available). Zendesk help widget, HubSpot chat.

## Global UI shell
- Top bar: hamburger (collapsible main menu), school logo → dashboard, global search ("/" hotkey; filters: School Directory, Subjects, Classes, Year Groups, Groups, Files & Resources, Guides), Quick Add (+), Notifications (with unread summary + preferences), Chat, Settings (gear → /settings, admin only), Help & Support, Accounts Portal (Faria SSO switcher), profile menu (Profile, Notification Preferences, Personalisation, Privacy Preferences, Logout).
- Right sidebar: resizable, chat bot ("AI assistant"), sidebar items list.
- Session: auto-logout after inactivity with 5-min warning modal; "Remember me for 30 days" on login; timezone mismatch warning banner linking to profile.
- Cookie consent manager w/ categories (Strictly Necessary, Functional, Analytics, Marketing) and per-cookie tables.
- Login page: school-branded (logo + name), email+password, forgot password (/reset-password/new), remember-me checkbox.

## Main menu (teacher role)
- **My Workspace**: /teacher/home (dashboard), Calendar /teacher/calendar, Homeroom /teacher/homeroom/advisory-comments, Reviews & Progress /teacher/projects, Tasks & Deadlines /teacher/tasks_and_deadlines
- **Portfolio**: /teacher/portfolios
- **Year Group**: list of all year groups → /teacher/year-groups/:id, Browse All /teacher/year-groups
- **Classes**: /teacher/classes/all
- **Groups**: Parents Association /teacher/pa, Browse All /teacher/groups/all
- **Insights**: Reporting /teacher/reporting/diploma/proofing/by_subject, Curriculum /teacher/curriculum_analysis/diploma, Engagement Analytics /teacher/engagement/students/analytics, Academic Analytics /teacher/academic_analytics, eCoursework Dashboard /teacher/ib-submissions
- **Explore**: /teacher/explore/subjects
- **Faria Service Manager**: /settings/billing/services_manager

## Dashboard (My Workspace, /teacher/home)
- "Welcome, {name}" + date; Customise Dashboard (choose Quick Actions & Widgets).
- Widgets seen: Daily Calendar (day nav + date picker), Reviews & Progress (pending approvals/reviews), Recent Search History, Tasks & Deadlines (Upcoming/Past tabs).

## Year groups (from nav)
- Class of 2025 (G12), 2026 (G11) — DP
- IB Middle Years Class of 2028 (G10), 2029 (G9), 2030 (G8), 2031 (G7), 2032 (G6) — MYP
- IB Primary Years Class of 2033 (G5), 2034 (G4), 2035 (G3), 2036 (G2), 2037 (G1), 2038 (KG2) — PYP
- (note: no "Class of 2027" visible — gap year group?)

---

# ADMIN SETTINGS (/settings)

Settings index groups: **General** (School Settings, Services Manager), **Admin** (School Directory /settings/users, Import Manager /settings/import/students/new, Data Exchange /settings/data-exchange/one-roster/imports/new, Behaviour & Discipline /settings/behavior, Security & Permissions /settings/permissions, Guides & Handbooks /settings/guides/diploma/cas), **Academics** (IB Diploma /settings/diploma/term-sets, IB Middle Years, IB Primary Years), **Account** (Billing /settings/billing, Integrations, Develop = Public API tokens).

## School Settings (/settings/school/*)
Sub-pages: name-and-logo, academic-functions, grades (Grades & Levels), user_mentions_permissions (Discussions & User Mentions), quick_links, grb-and-pamoja, ai-assistant, cas-and-sa, terminology, branding.

### Name, Address & Logo
- School name, IB School Code, Session (May/November), Language of instruction (radio: En, En-GB, Es, Fr, De, Zh-Hans), Additional languages (checkboxes), Grammar checker language (off/US/GB).
- Contact info: address 1/2, city, state, postal, country (full list), timezone (full tz list), phone.
- Logos: School Logo (login+dashboard, <200px), Top Navigation logo (32px square or wide; show/hide school name), Print logo for reports (1000–1500px; normal 30%/full 100% width).

### Academic Functions (/settings/school/academic-functions)
- Curriculum/programme catalogue (enable per school):
  - International Baccalaureate: IB Diploma, IB Career-related Programme, IB Middle Years, IB Primary Years
  - Pearson Edexcel: International Advanced Levels, BTEC, International GCSEs
  - Cambridge: Advanced, IGCSE, Lower Secondary
  - College Board: Advanced Placement
  - National Curriculum: High School, Middle School, Primary School
- Key academic function toggles: Classes (all programmes except DP), Parents Association, Annotations.
- Term Grades Calculation: Percentage weights vs Absolute weights (categories weighted to 100% vs 1–100 absolute).
- Points-based averaging option (total points achieved / max points per category).
- Grade Behaviour on Year Group switch: Match Group Grade / Match Group Grade if Blank / Preserve Grade. Bulk Update page exists for student grades.

### Grades & Levels (/settings/grades)
- Grade & Year format choice: "Grade 11 & 12" vs "Year 12 & 13" naming.
- Matrix: grade levels Pre-K2…Grade 12 × programmes (PYP, MYP, DP) checkboxes = which levels belong to which programme.

### Discussions & User Mentions
- Enable Discussions per context: Classes, Year Groups, Groups (school-wide kill switches).
- Student @mention permission (students/teachers/admins within class/YG/group discussions); Parent @mention permission (teachers/admins within Parents Association). Mentions trigger notifications.

### Quick Links
- Admin-curated link folders w/ roster (audience targeting). "Add Quick Link", folder list.

### Global ResourceBank & Pamoja
- GRB: cross-school sharing of units/lessons/assessments, approval process, CC BY-NC 4.0 license, permissions (Import / Contribute), teacher guidance rich-text.
- Pamoja Online Courses integration (DP online courses; registration requests via DP Plans worksheet); Pamoja Lesson Suite (import units via GRB).

### ManageBac AI (/settings/school/ai-assistant)
- Tabs: AI Suite, AI Usage. School-level enable/disable per feature; enabled features default to admins only; teacher/advisor access via Security & Permissions.
- Features: Notifications Summary, Writing Assistant (all text boxes, AI task descriptors), AI Assistant (chat in Academic Analytics: trends, learning gaps), AI Translations (KeyChat, Portfolio, Class Streams; on by default for all).
- Compliance notes: data not used to train models, EU AI Act/GDPR.

### CAS & Service Action (/settings/school/cas-and-sa)
- School-editable guidance texts shown to students/supervisors: Learning outcomes text, Supervisor review question, Supervisor review text, Reflections guidance (rich text editor with AI assist).
- Toggle: auto-mark activities complete when supervisor marks "Completed Successfully".

### Terminology (/settings/school/terminology)
- Rename nearly everything: Program tab, Homeroom tab, Behaviour & Discipline name, Homeroom Advisor/Counselor titles, attendance lesson period, local grade label, Discussion(s), Grade(s), High School/HS, Service Learning; per-programme (DP/MYP/PYP) advisor/coordinator/head titles+names; names used on reports.

### Brand Customisation (/settings/school/branding)
- Default landing page (Home/Dashboard/Calendar/Portfolio), UI colour themes (Blue/Orange/Red/Plum/Teal), Home wallpaper, login background (default/dynamic seasonal/custom image).

## Services Manager (/settings/billing/services_manager → managebac.com)
- Faria ecosystem storefront: ManageBac+ Standard/Pro bundles; Learning platforms per curriculum (all the curricula listed under Academic Functions, e.g. "Diploma Pro"); Add-ons: AssessPrep Standard/Plus (online assessment), BridgeU (university/careers), FariaLearn (PD); Admissions: OpenApply, OpenApply CRM, IDAT, PowerSchool Integration, SIMS Export; Schools-to-Home: SchoolsBuddy (Activities & Sports, Communications, Bookings, PTC scheduling; Pro: Transport & Dismissal, Micro Payments, Tuition Fee Billing); Online Courses: Pamoja.

## School Directory (/settings/users)
- Tabs: **Roster | Memberships | Bulk Update**; user groups: Students (1010), Teachers & Advisors, Parents, Observers, Admins (?group=students|advisors|parents|observers|admins).
- Roster table (students): Name, Grade, Parents (linked accounts), Last Accessed; search by name/email; include-archived filter; sortable columns; pagination; per-row actions: Edit (/teacher/users/:id/edit), Add parents, Archive student, Delete.
- **Memberships** (/settings/memberships): two-pane bulk assign — left: available students filtered by Grade/Homeroom (incl. "Without any Year Group", "Without Grade"); right: target Year Groups or Classes; select all/none; add/remove selected. Grade counts shown (e.g. KG1 175, KG2 153 — includes KG1/2039 year group).
- **Bulk Update** (/settings/users/update_emails): editable grid of First/Last name, Email (read-only), Student ID, Grade dropdown for all users at once.

## Import Manager (/settings/import/*)
- Tabs: Students, Parents, Teachers. CSV template download + upload; mode: create new vs update existing accounts; separate student photos import (zip?); "send to us for review" support path.

## Data Exchange (/settings/data-exchange/one-roster/*)
- OneRoster 1.2 CSV zip import/export; tabs: General, Import, Export, Exchange History; manifest.csv per OneRoster spec (ManageBac custom profile).

## Behaviour & Discipline (/settings/behavior)
- Tabs: Behaviour Types Settings | Behaviour Notes History.
- Enable Behaviour Notes toggle; Behaviour Types (rows: title + "Positive?" flag + delete); Next Steps (rows: title) — school-defined taxonomies.

## Security & Permissions (/settings/permissions)
- Tabs: **General** (/general) and **Teachers & Advisors** (/granular).
- General: login (block students/parents until date, remember-me toggle, reCAPTCHA), passwords (allow weak student/parent pw, min 6 chars), students (browse interview notes, lock approved activities, lock student profiles, restrict creating discussion threads in YG/Classes/Groups), parents (lock parent profiles, lock Parents Association), Additional Homeroom Advisors (enable, max 10/student, attendance-only access), privacy (online presence indicator), security (malware scan on file uploads).
- Teachers & Advisors: **Default Permissions** vs **Individual Permissions** (per-user overrides). Permission domains with tiered levels:
  - Classes: Full Access / Add New Class / None (admin ops on class roster: bulk assign, lock, import timetable, assign teachers & IDs, bulk create…)
  - Activity Groups: Full / Add New Group / None
  - Reports: Full Access / Proofing & Review / None
  - Student Directory: Full / Read-only / None
  - Engagement Analytics: Full / Class Members and Homeroom / None
  - Behaviour Notes History: Full / Homeroom Only / None
  - Academic Analytics: Full / None
  - eCoursework Dashboard: Full / Homeroom Only / None
  - Additional Homeroom Advisors: Behaviour & Discipline toggle; Proofing & Reviewing toggle
  - ManageBac AI: Writing Assistant toggle; AI Assistant toggle

## Academics settings (per programme: diploma / myp / ibpyp)
Full per-programme settings URL set (mirrored for each programme):
- /settings/{prog}/term-sets — Academic Terms
- /settings/curriculum/{prog}/subjects — Subjects
- /settings/curriculum/{prog}/units/templates — Unit Planner Template
- /settings/curriculum/{prog}/assessments/framework/for_tasks — Assessment
- /settings/curriculum/{prog}/pbl — Project-based Learning templates
- /settings/curriculum/{prog}/reflections — Reflections questions
- /settings/curriculum/{prog}/class_portfolios/framework — Class Portfolio settings
- /settings/curriculum/{prog}/portfolios/framework — Portfolio settings
- /settings/guides/{diploma/cas | myp/cs | ibpyp/sl} — Guides & Handbooks
- /settings/curriculum/{prog}/academic-analytics — Academic Analytics config
- PYP extra: /settings/curriculum/ibpyp/service-learning; PYP subjects tabs: Subjects | Subject Teachers | Subject Descriptions (custom subjects allowed, e.g. Islamic Studies, Somali)
- /settings/diploma/academic-year-checklist — new-year setup checklist

### Academic Terms (term-sets)
- Per programme, academic years (e.g. "August 2025 – June 2026", flagged Current) each containing terms (Semester 1: Aug 31–Jan 23; Semester 2: Feb 6–Jun 26). Prior years archived, future years pre-created. Terms group gradebook tasks + drive reporting schedule.

### New Academic Year wizard (6 steps, progress-tracked checklist w/ time estimates)
1. Configure New Academic Terms (10 min)
2. Transition Year Groups (10 min) — archive graduating YGs; rename/re-grade remaining YGs (Class of 2025 G12→archive; others move up)
3. Transition Classes (60 min) — per subject; types: Archive & duplicate into next grade / into existing grade / transition to next year (2-year DP courses); set new grade + start/end academic terms per class; carry over messages/files/student list. Transitions History page.
4. Import Classes (60 min) — CSV: Class ID, Year, Group (subject group), Subject, Name, Level (HL/SL/…), Option, Section, Teacher emails (| separated), Description. Grade/terms/language/subject immutable after creation. "Supported Subjects" reference download.
5. Import Students (CSV; create or update modes)
6. Bulk Assign Students to Classes (CSV: student ID or email → class ID; modes: bulk assign / bulk assign and remove)

### DP Subjects (/settings/curriculum/diploma/subjects)
- Tabs: Subjects | Options & Levels | Extended Essay Subjects.
- Checkbox catalogue by IB group: G1 Studies in Language and Literature (80+ languages), G2 Language Acquisition, G3 Individuals & Societies, G4 Sciences, G5 Mathematics (AA/AI), G6 Arts, Core (CAS, EE, TOK), + N "Additional Subjects" slots (0–3).
- School's enabled DP subjects (from transition page): English, Arabic, Economics, History, Biology, Chemistry, Physics, Design Technology, Math AI, TOK, EE.

### MYP Subjects
- Groups: Language and Literature, Language Acquisition, Individuals & Societies, Sciences, Mathematics (Standard/Extended), Arts, PHE, Design, Core (Community Project, Personal Project, Service as Action).

### Unit Planner Template settings (per programme)
- Tabs: Unit Planner Template | Standards | Approaches to Learning | Learner Profile | Components | Reflections.
- Every unit-plan field configurable: Title, Hint, "Show on At-a-Glance" toggle. Sections: Inquiry & Purpose (Transfer Goals, Central Idea, Guiding Questions, Missed concepts), Curriculum (Aims, Objectives, Syllabus, Standards, Content, Skills, Concepts), ATL Skills, Learner Profile, Connections (Metacognition, International Mindedness, Academic Integrity, ICT, Language & Literacy, Cross-/Co-curricular links), Assessment (Formative, Summative, Peer & Self, Standardization & Moderation, Assessment Criteria), Learning Experiences (Prior Learning, Teaching Strategies, Feedback, Student Expectations, Support Materials, Pedagogical Approaches, Unit Activities, Differentiation), Reflections & Evaluation (Looking Back/Forward, worked well/didn't, Transfer Reflection, After the unit), Stream & Resources.

### Assessment settings (per programme)
- Tabs: Framework | Types | Categories (per-subject; name, colour, default weight) | Assessment Models | Grade Scales. MYP variant: Final Grades (MYP 1–7+Failing → local equivalents A+…E, per grade level) and Criteria instead of Grade Scales.
- Task assessment models: Observation (comments only), Binary (complete/incomplete), Points, Criteria — each toggleable + "enabled by default".
- Advanced options: task-specific grade scales, task-specific criteria clarification, Dropbox enabled by default, default submission opening date (1–14 days before due / immediately), hide results until published, hide scores & show scale grades only, show student averages to teachers/parents/students.
- Grade Scales: global default scale (rows: "≥ X%" → Mark); custom scales per category possible. Task and Term scales separate.
- Term assessment models: rubric/standards-based models per subject/group ("Standards" builder for terms; "Criteria" for tasks).
- Assessment Types page: rows Abbreviation, Name, Label Colour (e.g. Summative/Formative).
- MYP Criteria page: per grade-level (6–10) per subject-group criteria A–D (IB defaults, e.g. Sciences: Knowing & understanding / Inquiring & Designing / Processing & Evaluating / Reflecting on Impacts), achievement level bands 0, 1–2, 3–4, 5–6, 7–8, each with Summative and Formative descriptors, editable, "Reset to subject group defaults".
- MYP task assessment page notes MYP is criteria-locked (only Binary can be added for formative/custom).

### PBL (Project-based Learning) settings
- DP templates: TOK Exhibition (EX), TOK Essay (TOK), Extended Essay (EE) — imported from library, editable.
- MYP: Personal Project (PP), Community Project (CP), Interdisciplinary Project (IDU) + Interdisciplinary Templates spanning subjects (e.g. "Narrative Design IDU": Digital Design + English).

### Reflections settings
- Per-grade advisory reflection question (DP: Grade 11 Question, Grade 12 Question).

### Portfolio settings (per programme; tabs: Framework | Access & Permissions | Terminology)
- Evidence of Learning types: File, Website, Photo, Note (each toggleable) + File Guidance rich text.
- Goals + Goal Guidance; Reflections + Reflection Guidance (default reflective-cycle prompts).
- Miscellaneous toggles: Learning Connections, Likes, Discussions.

### Academic Analytics settings (per programme; MYP example: "Achievement Snapshot")
- Maps MYP criterion averages (0–8) to statuses Concern / On-Track / Excellent (school-set ranges), per subject or globally.
- Submission behaviour scoring: weights per dropbox status (Waiting, Late, Early and Late, Early) → submission score → status ranges.

### Guides & Handbooks (/settings/guides/...)
- Per programme core area (DP: CAS, EE, TOK + Portfolio; MYP: cs=Community Service?; PYP: sl=Service Learning). Editable guide sections (What is CAS?, Ideas, Purpose, Process, Assessment, Timeline, Experiences, CAS Stages, Project, Reflection, CAS Staff, FAQs, + Add Section), include CAS video toggle, Handbook uploads (incl. from GDrive).

## Account settings
- Billing (/settings/billing — nav blocked in this session), Services Manager (Faria storefront).
- Integrations (/settings/integration/partners + /sync): AssessPrep, OneRoster sync, Clever SSO/provisioning, Edlink Flow (Google Classroom), TurnItIn, Concord Infiniti (library), Google Upload/Docs/SSO, OneDrive Upload, Microsoft SSO, BridgeU, iSAMS, SchoolsBuddy, Zoom, Veracross SIS.
- Develop: /settings/develop/auth/api-manager (OAuth2 credentials), api-manager-legacy (legacy tokens), api_reference, changelog. Public API exists.

---

# YEAR GROUPS (/teacher/year-groups/:id)

Year Group = cohort container per programme+grade. Header: name, programme+grade, student count, "Open Students List". Common tabs across programmes: Overview (activity stream + announcements + Quick Add deadline + QuickStart checklist), Discussions, Calendar, Files, Members, Edit Settings, external links.

Programme-specific tabs:
- **DP** YG: Plans (DP subject-choice worksheet per student, incl. Pamoja course requests), CAS (cas-activities), TOK Exhibition / TOK Essay / Extended Essay (PBL instances /pbl/:templateId/students).
- **MYP** YG: SA (sa-activities = Service as Action), Personal Project (grade 10), Community Project?, Interdisciplinary Project (PBL instances).
- **PYP** YG: SL (sl-activities = Service Learning). (Exhibition would appear if configured.)

## Year Group QuickStart checklist (empty YG)
1. Configure Year Group Settings (exam registration & managing the programme) 2. Add Students 3. Assign Advisors — with progress "0 of 3 Completed".

## Edit Year Group Settings (DP example)
- Name, Grade (programme:grade), Graduation Year, Description, Announcement Bulletin (rich text), cover image.
- Diploma Plan section: Diploma Plan toggle, Invoicing Option, Pamoja Online Course.
- CAS/Activity settings: track hours toggle, hours chart, CAS aims & goals, optional question, CAS total hours, activity description title; **Learning Outcomes table** (icon, short name, description); **CAS Questions** (question → linked outcome).
- Templates: which PBL templates attach (TOK Exhibition, TOK Essay, EE).
- Additional: enable discussions, citation link (None/EasyBib MLA-APA/Harvard), Archive year group, Delete year group.

## Members pages
- Sub-tabs: Students | Homeroom Teacher | SA (CAS) Advisors | PP Advisors | More. Students table: Name, Student ID (#HIAxxxx), Joined At, Last Accessed; Add Students; Bulk Assign; search.

## CAS/SA/SL activity trackers (per YG)
- Status summary chips: Excellent / On-track / Concern / To Be Determined (counts).
- Students grouped by advisor ("Students without advisor" group); per-student counts: Experiences, Outcomes, Reflections & Evidence, Interviews.
- Lock All Worksheets; Outcomes tab; Latest Activity feed; search/filter.

## PBL project instance (e.g. MYP Personal Project)
- Views: Students (grouped by Supervisor) | Proposal | Assessment | Deadlines | Alphabetically | Reflections. "Lock Worksheets".
- Per-student assessment columns: Total + criteria (PP: A Planning, B Applying Skills, C Reflecting; 0–8 each); "New changes" badge when student updated work.
- **Student project workspace** (teacher view): tabs Workspace | Journal | Assessment | Meetings with Supervisor | More; status pill (Excellent/On-track/Concern/TBD); Goals (learning goal + product goal, editable); Personal To-Dos; Deadlines; Project Documents (file uploads); Notes (rich text; "Record as Interview Note" → auto-emailed).

---

# CLASSES

## Classes roster (/teacher/classes/*)
- Tabs: My Classes | Browse All Classes | Classes Manager | More. 24 active classes here (MYP G9 A/B sections etc.).
- Filters: term (academic year+semester), programme, grade, subject group, teacher; search by name/description/class ID; Show Archived; Add Class.
- Class card: name, student count, avatars, quick links: Gradebook, Join, Units (n), Tasks (n), Updates (n).
- Classes Manager (admin): transition classes, bulk ops, import timetable, assign teachers & IDs, etc. (per permissions doc).

## Class page (/teacher/classes/:id)
- Header: subject name, subject group — subject, student count, "New Resources" badge.
- Tabs: **Overview | Class Stream | Tasks & Units | Gradebook | Discussions | Calendar | Files | Members | (More)**; actions: Edit Class Settings, Join Class, Add External Link; QuickStart checklist (Set Task Categories & Assessment, Confirm Timetable/location, Add students...).
- **Overview**: Latest Activity feed (task added/updated with badges Summative/Formative + category Exam, submission count "14/19 Students", due time; unit updated events), announcement bulletin, Quick Add.
- **Class Stream**: posts of class content (files, websites, photos, notes); sub-views: Actions | Students (per-student stream /users/:id/class_stream) | Timeline.
- **Tasks & Units**: Upcoming Tasks (Add Task / Import Tasks / Show All); Units list w/ View selector (All Units or by subject e.g. "Standard MYP"), List/Weekly/Calendar views, search, draft & archived filter. Unit card: name, start week ("Starts W2 Feb"), duration (weeks), lesson count, task count, Active/Draft status.
- **Unit planner** (/units/:id/planner): views At-a-Glance | Planner | Stream & Resources | Assessments. MYP sections (matching admin template): Summary (title, framework, subject, year, start, duration, description); Inquiry: Key Concepts (+definitions), Related Concepts, Conceptual Understanding, Global Context + explorations, Statement of Inquiry, Inquiry Questions (Factual/Conceptual/Debatable + line of inquiry); Curriculum: Aims, MYP subject-group objectives (A–D with strands), Standards & Benchmarks, Content & Skills; ATL Skills (skill categories → clusters → strands); Learner Profile; Learning Experiences; Assessment; Reflections. Each section: "Edit Section" + "Write a reflection".
- **Gradebook**: sub-tabs Tasks | Term Grades | More; per-term (semester selector).
  - Tasks view: grid students × tasks (column header: date, title, category badge); cell: Points earned/max + criteria levels (A–D); auto-save; sort by due date; Export Task Grades (xml/Excel).
  - MYP Term Grades view: per student — criteria A–D level pickers (N/A, 0–8), Sum (/32), Final Grade (1–7), Local equivalent (A+ etc.); ATL Skills ratings (Communication, Social, Self-Management, Research, Thinking × Exceeding/Meeting/Approaching/Below); rich-text comment with AI assistant; view options: Comments, ID Assessment, Progress Charts, Rubrics, Field Checker; auto-save.
- **Task detail** (/core_tasks/:id): date, title, badges (Summative/Formative + category), submissions x/y, due time, linked unit card, Assessment Options (selected criteria A–D), **Dropbox**: per-student status (LATE / WAITING / on-time), submitted files, annotation link (coursework annotation), actions: Prepare all files as ZIP, Lock All Submissions, Extend Due Date; Resources (Add Resource); Discussions (create/view).
- **Members**: Students | Teachers tabs; table Name, Joined at, Last Accessed; Add Students; Export to Excel.
- **Edit Class Settings**: cover image, class name (blank = subject name), Section, Class ID, Description, Announcement Bulletin; Lock Memberships (Teachers & Students / Teachers-only / Students-only / None); Enable discussions; Archive class (students lose access; tasks/units/resources not archived); Delete class.
- Attendance: per-class attendance settings link exists ("Confirm Timetable including class location") but redirects when timetable/attendance not configured for the school.

---

# GROUPS, WORKSPACE FEATURES

## Groups (/teacher/groups/all, /teacher/pa)
- Activity/interest groups (clubs, committees). Tabs: My Groups | Browse All Groups; Add Group; Assign Group Advisors; Show Archived; search. (None created at this school.)
- **Parents Association** = special built-in group: tabs Overview | Discussions | Calendar | Files | Members | More; Edit Group Settings; Join Group. Group structure mirrors year groups minus academics.

## Calendar (/teacher/calendar)
- Month/Week views, prev/next, Add Personal Event, Filter by Programme. Aggregates class/YG/group deadlines & events + personal events.

## Tasks & Deadlines (/teacher/tasks_and_deadlines)
- Cross-context list of the teacher's tasks: Upcoming | Past tabs.

## Homeroom (/teacher/homeroom/*)
- Tabs: Advisory Comments | Term Grades | More. Per programme + per term; homeroom advisor writes advisory comments and views term grades for assigned students; auto-save.

## Portfolio (teacher view, /teacher/portfolios)
- Grade selector (every grade KG1–G11 has a portfolio "grade" id); views: By Advisor | Alphabetically; Actions incl. Export Portfolio Timelines; students list w/ **IBeC Submission Status** column (IB eCoursework).
- **Student portfolio** (/teacher/users/:id/portfolio): tabs Timeline | Goals | Files | More; Add Evidence of Learning; Timeline = chronological cards of coursework submissions (EARLY/LATE badge, task ref w/ Summative/category badge, submitted file + size, Annotated File, View Submission, Download, comment count, Learning Connections count, likes).

## Reviews & Progress (/teacher/projects)
- Tabs: Projects | CAS | Service as Action | Service Learning | More; filters All Programmes/DP/MYP; "Your Projects" vs "My Students" — advisor-centric queue of project supervision & activity approvals.

---

# INSIGHTS

## Reporting (/teacher/reporting/{programme}/...)
- Tabs: Proofing & Review | Generate Reports | More (Templates, Reports History, Transcripts).
- **Proofing & Review**: per programme + term; views By Subject | By Student | Reflections; subjects listed by group with class counts; "Lock Term Gradebook" action. Reviewers check term grades/comments before report generation.
- **Generate Reports**: setup checklist (1 upload hi-res logo, 2 set term dates, 3 configure options & rubrics, 4 customise template). Form: Programme, Academic Term (+ "use Final average"), Years (grades w/ student counts), Report Template (programme templates + Multi Curricula; Edit Template; "last generated" info), Report Title, Generation Type (Web+PDF / Web only / PDF only), PDF naming convention (title/grade/name/date/ID), Sort Order (family name/year/homeroom), Preparation Date, Schedule Future Release, Notify parents & students via email, Preview report + notification email. Export Term Grades action.
- **Templates**: Multi Curricula Templates (add new / add from library; per programme; can include additional programmes' classes in one report card; can't delete in-use) + legacy PDF Templates (+subtemplates; legacy after July 2025). Report cards generated based on YG membership + class membership.

## Curriculum (/teacher/curriculum_analysis/{programme})
- Tabs: Curriculum | Whole-School Curriculum | More. Unit Calendar per class (all classes listed w/ grade); **Curriculum Analytics** lenses: Approaches to Learning, Inquiry Questions, CAS Connections, TOK Connections, Language and Learning, Differentiation, Support Materials, Learning Process, Standards, Learner Profile. Vertical/horizontal curriculum mapping across school.

## Engagement Analytics (/teacher/engagement/students/analytics)
- Per programme + term; engagement buckets: Not Engaged / At-Risk / On-Track / Highly Engaged (counts); student table: Task Completion, Online Lessons Joined, Last Login; actions: Send Student Reminders, Edit Student Reminder Template; search/sort/pagination.

## Academic Analytics (/teacher/academic_analytics)
- Filters: Programme, Subject Group, Subject, Class, Student, Academic Term, Class Grade Level.
- Achievement Snapshot (Concern/On-Track/Excellent counts; "Manage Calculation" → settings), distribution charts, Grade Distribution, Workload chart (Highcharts). AI Assistant chat available here (per AI settings).

## eCoursework Dashboard (/teacher/ib-submissions)
- IB DP eCoursework (IBeC) upload tracking per grade — student list w/ submission status to IB. (Empty here.)

## Explore (/teacher/explore/subjects)
- Tabs: Subjects | Topics. Browse curriculum subject resources per programme (incl. subjects not yet offered); "Add Class" shortcut.

---

# USER PROFILE & NOTIFICATIONS
- Profile page (role badge "Account Admin"): Personal Information (DOB, gender, nationalities, languages), Contact Details (email, address, phones), Professional Details (Job Functions e.g. Technology Director; Programmes & Subjects taught), Edit Profile, Change Password, photo.
- Tabs: Profile | Notification Preferences | Personalisation | More.
- Notification Preferences: channel matrix (Web / E-mail / Mobile push) × categories:
  - Service Learning: CAS, Service as Action, Service Learning worksheets/activities
  - Project-based Learning: EE (legacy), TOK (legacy), Personal & Community Projects (legacy), PBL
  - Year Groups: Events, Files, Discussions
  - Classes: Class Streams, Tasks & Resources, Events, Memberships, Portfolio, Files, Discussions
  - Homeroom: Behaviour notes
  - Groups: Events, Files, Discussions
  - Digests (frequency None/Daily/Weekly): Coursework Submission (late), Curriculum (new units), Behaviour & Discipline, Service Learning
  - Chat & User Mentions
- Roles seen: Account Admin (full settings), Teacher/Advisor (granular permission tiers), Student, Parent, Observer. Teacher UI = /teacher/*; student and parent get own portals (student view has My Workspace/Portfolio/Year Group/Classes/Groups per initial nav).
