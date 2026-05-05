# quip-learn — Agent Instructions

## Project Overview

**quip-learn** is a free, value-added learning platform for LifeBank customers. It delivers curated micro-learning content (articles, quizzes, short courses) tailored to healthcare workers — helping them enhance skills, stay updated with industry knowledge, and grow professionally.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript (Vite) |
| Styling | shadcn/ui + Tailwind CSS v4 |
| Routing | React Router v7 |
| Backend | REST API at `https://quip.lifebank.ng/api` |

## Common Commands

```bash
npm run dev       # start dev server (http://localhost:5173)
npm run build     # production build
npm run preview   # preview production build
npx tsc --noEmit  # type-check without building
npx shadcn@latest add <component>  # add a shadcn/ui component
```

## Folder Structure

```
src/
  components/ui/   # shadcn/ui components (do not edit manually)
  lib/
    api/lms.ts     # all API call functions — never fetch from components directly
    utils.ts       # shadcn cn() helper
  pages/
    CoursesPage.tsx       # /courses
    CourseDetailPage.tsx  # /courses/:id
    LessonPage.tsx        # /lessons/:id
  types/
    lms.ts         # Course, Module, Lesson, payload types
  App.tsx          # BrowserRouter + route definitions
  main.tsx         # entry point
```

## API Reference

Base URL: `https://quip.lifebank.ng/api` — read from `VITE_API_URL` env var (see `.env`).

| Method | Endpoint | Function in `lib/api/lms.ts` |
|--------|----------|------------------------------|
| `GET` | `/lms/courses` | `getCourses(cohort?)` |
| `GET` | `/lms/course/{id}` | `getCourse(id)` |
| `GET` | `/lms/lesson/{id}` | `getLesson(id)` |
| `POST` | `/lms/submit-quiz` | `submitQuiz(payload)` |
| `POST` | `/lms/submit-assignment` | `submitAssignment(payload)` / `submitAssignmentFile(formData)` |
| `POST` | `/lms/complete-lesson` | `completeLesson(payload)` |

## Project Conventions

- Use **TypeScript** strictly — avoid `any`; types live in `src/types/lms.ts`.
- Prefer **functional components** with hooks over class components.
- Use **named exports** for components; default exports only for pages.
- Install shadcn components with `npx shadcn@latest add <name>` — never copy manually.
- Use Tailwind utility classes only; avoid inline `style` props.
- All API logic lives in `src/lib/api/lms.ts`; never call `fetch` directly from components.
- All mutations (submit-quiz, submit-assignment, complete-lesson) must show loading + error state in the UI.
- Keep UX accessibility-first (WCAG AA): meaningful alt text, keyboard navigation, sufficient contrast.
- Never store sensitive user data in `localStorage`; use secure server-side sessions.
- Never hardcode the API base URL — always use `import.meta.env.VITE_API_URL`.

## Key Relationships
- **LifeBank integration**: quip-learn is a companion service to LifeBank; authentication may be federated from LifeBank's platform.
- **Content model**: Courses → Modules → Lessons. Quizzes and assignments are lesson types.
