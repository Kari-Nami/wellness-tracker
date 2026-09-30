# Wellness Tracker:  Requirements & Specification

## 1. Product Summary

The Wellness Tracker is a responsive web application for recording day-to-day wellness information, maintaining healthy routines, reviewing personal trends, and staying motivated through lightweight gamification.

The application centers on a structured **Daily Check-In** that captures sleep, hydration, mood, meals, alcohol/sobriety status, bowel movement status, and completion of user-defined daily habits. Users can review previous days through a calendar, update missing or incorrect information, monitor trends through simple analytics, maintain streaks, earn points, and compare scores through a privacy-conscious leaderboard.

The product is intentionally focused. It is not intended to provide medical diagnosis, clinical recommendations, detailed nutrition analysis, or comprehensive health coaching.

---

## 2. Product Goals

The application should:

- Make daily wellness logging fast and easy.
- Encourage consistent tracking without making the experience feel burdensome.
- Give users useful summaries and trends from their historical data.
- Allow users to define additional daily habits that matter to them.
- Provide lightweight motivation through points, streaks, and a leaderboard.
- Allow administrators to manage the global scoring rules used by the gamification system.
- Protect each user's private wellness data from other users.
- Provide a polished, responsive, consumer-style user experience.

---

## 3. Product Scope

### In Scope

The product includes:

- User registration and authentication.
- User and administrator roles.
- Daily wellness check-ins.
- Historical check-in editing.
- Calendar-based history.
- Sleep tracking.
- Water intake tracking.
- Mood tracking.
- Meal tracking.
- Alcohol/sobriety tracking.
- Bowel movement tracking.
- User-created daily habits.
- User wellness targets.
- Points and point history.
- Check-in and habit streaks.
- Leaderboard.
- Basic wellness statistics and trends.
- Administrative point-rule management.
- Responsive web design.
- Production deployment on an Azure virtual machine.

### Out of Scope

The product does not include:

- Medical diagnosis.
- Medical treatment recommendations.
- Clinical interpretation.
- Doctor or healthcare-provider communication.
- Medication tracking.
- Emergency or crisis functionality.
- Wearable integrations.
- Apple Health or Google Fit integration.
- Automatic sleep detection.
- Detailed calorie or macronutrient tracking.
- Barcode-based food logging.
- Food image recognition.
- Health coaching.
- Social feeds.
- Direct messaging.
- Comments between users.
- Complex challenges or tournaments.
- Virtual currency or item shops.
- Complex achievement systems.
- Configurable habit schedules or weekly frequencies.
- Free-text journaling or daily notes.

---

## 4. Technology and Architecture Constraints

The system shall use the following technology stack:

- **Frontend:** React.
- **Backend:** Next.js.
- **Database:** MongoDB.
- **Communication:** REST API over HTTP/HTTPS.
- **Hosting:** Azure Virtual Machine.
- **Deployment model:** Traditional VM-hosted applications. Serverless hosting is not used.

The frontend and backend are separate applications and separate code repositories.

### High-Level Architecture

```text
┌──────────────────────────────┐
│        User's Browser        │
└──────────────┬───────────────┘
               │
               │ HTTP / HTTPS
               ▼
┌──────────────────────────────┐
│        React Frontend        │
│                              │
│ User interface, forms,       │
│ charts, calendar, dashboard  │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│       Next.js Backend        │
│                              │
│ Authentication               │
│ Authorization                │
│ Validation                   │
│ CRUD operations              │
│ Gamification logic           │
│ Analytics support            │
└──────────────┬───────────────┘
               │
               │ Database access
               ▼
┌──────────────────────────────┐
│           MongoDB            │
│                              │
│ Users                        │
│ Daily Check-Ins              │
│ Habits                       │
│ Point Rules                  │
└──────────────────────────────┘
```

The React frontend shall not access MongoDB directly. All persisted application data shall be accessed through the Next.js backend.

---

## 5. User Roles

The system supports two roles.

### 5.1 Standard User

A standard user can:

- Register and authenticate.
- Manage their personal profile and wellness targets.
- Complete daily check-ins.
- View and edit previous check-ins.
- Create and manage custom daily habits.
- Mark daily habits as completed.
- View personal statistics and trends.
- Earn points.
- Build streaks.
- View the leaderboard.
- View their own point activity.

A standard user must not be able to access another user's private wellness data.

### 5.2 Administrator

An administrator is responsible for managing global point rules.

An administrator can:

- Authenticate through the same account system.
- Access the administrative point-rule interface.
- View existing point rules.
- Create point rules for supported triggers.
- Edit point values.
- Enable, disable, or delete point rules.
- Log out.

Administrator accounts do not participate in the normal wellness leaderboard.

The backend must enforce role-based authorization. Hiding administrator controls in the frontend is not sufficient protection.

---

## 6. Authentication and Authorization

The application shall provide:

- User registration.
- User login.
- User logout.
- Persistent authenticated sessions or tokens.
- Protected user routes.
- Protected administrator routes.
- Backend authorization checks for administrator-only actions.
- Ownership checks for user-specific data.

A user shall only be able to read or modify records that belong to their own account, except for intentionally public leaderboard data.

The authentication system does not need third-party login providers or multi-factor authentication.

---

# 7. Daily Check-In

The **Daily Check-In** is the central wellness record in the application.

A check-in represents the user's wellness information for a specific calendar date.

A user should normally have no more than one Daily Check-In per date.

The user shall be able to:

- Create today's check-in.
- View today's check-in.
- Update today's check-in.
- View historical check-ins.
- Create a check-in for a previously missed date.
- Update a previous check-in.
- Delete a check-in.
- See whether a day's check-in is complete, partial, or missing.

The application should make today's check-in the highest-priority interaction.

Historical backfilling should be available but should not distract from completing the current day.

---

## 8. Daily Check-In Fields

### 8.1 Sleep

The user shall be able to record:

- Sleep duration.
- Subjective sleep quality.

Sleep quality should use a small predefined scale such as:

- Poor.
- Fair.
- Good.
- Great.

The application may compare sleep duration against the user's personal sleep target.

The system does not require automatic sleep detection, sleep-stage tracking, or wearable integration.

### 8.2 Water Intake

The user shall be able to record how much water they consumed during the day.

The system shall:

- Use a consistent stored measurement.
- Allow the UI to display a user-friendly unit.
- Compare daily intake against the user's configured water target.
- Make updating water intake quick and low-friction.

The exact UI control may be determined during implementation.

### 8.3 Mood

The user shall be able to record their overall mood for the day using a small fixed scale.

Recommended scale:

- Very Bad.
- Bad.
- Okay.
- Good.
- Great.

Mood values should be suitable for aggregation and trend analysis.

The application does not provide clinical interpretation of mood.

### 8.4 Meals

Meals remain part of the Daily Check-In rather than being treated as a separate major feature.

The user shall be able to record basic meal information for the day.

Supported meal categories should include:

- Breakfast.
- Lunch.
- Dinner.
- Snacks.

Each meal may contain a short description of what was eaten.

Example:

```text
Breakfast
Eggs, toast, and coffee
```

The meal-tracking feature should remain lightweight.

The application does not include:

- Calorie calculations.
- Macronutrient calculations.
- Food databases.
- Barcode scanning.
- Recipe tracking.
- Food recognition.

### 8.5 Alcohol / Sobriety Status

The user shall be able to record an alcohol-consumption status for each day.

The supported states shall include:

- Not logged.
- None.
- Light.
- Heavy.
- Blackout.

The system must distinguish between:

- The user explicitly recording no alcohol consumption.
- The user not recording alcohol information.

This distinction is important for statistics and completion calculations.

Alcohol/sobriety information remains part of the Daily Check-In rather than being treated as a separate standalone feature.

### 8.6 Bowel Movement

The user shall be able to record a simple bowel-movement status for the day.

The tracking should remain intentionally lightweight.

A suitable scale may include:

- Not logged.
- None.
- Uncomfortable.
- Normal.
- Good.

The final wording of the scale may be adjusted during design as long as the system continues to distinguish between no entry and an explicitly recorded state.

### 8.7 Daily Habit Completion

The Daily Check-In shall also record the completion state of the user's active custom daily habits.

For each relevant habit, the user should be able to mark whether it was completed for the selected day.

Habit completion history is associated with the date, while the Habit model itself defines what the habit is.

### 8.8 Daily Completion State

The system should calculate whether a Daily Check-In is:

- Complete.
- Partial.
- Missing.

The definition of a complete check-in should be based on required built-in fields.

Habit completion may contribute to progress or points but should not necessarily prevent the main Daily Check-In from being considered complete unless explicitly defined that way.

The UI should clearly communicate the user's current completion status for the day.

---

# 9. Calendar and Historical Tracking

The application shall provide a calendar-based history view.

The calendar shall allow users to:

- Navigate across dates.
- Identify complete days.
- Identify partially completed days.
- Identify missing days.
- Open a previous date.
- Add missing information.
- Edit previously entered information.
- Delete an incorrect historical check-in.

The calendar should visually distinguish daily states without requiring the user to open every day.

The application may gently highlight missing or incomplete dates, but should not make historical completion more prominent than today's check-in.

---

# 10. Custom Daily Habits

Users shall be able to define custom habits that they want to complete every day.

Examples include:

- Exercise.
- Meditate.
- Take vitamins.
- Stretch.
- Go outside.
- Read.

All custom habits are daily habits.

The system does not need:

- Weekly schedules.
- Specific weekdays.
- Monthly frequencies.
- "Three times per week" logic.
- Custom recurrence rules.

A Habit should contain enough information to identify and display it, such as:

- Owner.
- Name.
- Optional short description.
- Active status.
- Creation and modification timestamps.

Users shall be able to:

- Create a habit.
- View their habits.
- Edit a habit.
- Delete a habit.
- Mark habit completion for individual dates.

Deleting a habit must not expose or modify another user's data.

---

# 11. User Wellness Targets

Wellness targets are stored as user-level settings rather than standalone goal objects.

Targets correspond to the built-in tracked fields.

Examples include:

- Target sleep duration.
- Target water intake.
- Target number of meals.
- Target mood.
- Target bowel-movement quality, if retained.

Targets are personal settings and may be used by:

- Dashboard progress indicators.
- Statistics.
- Point triggers such as reaching the user's water or sleep goal.

The application should provide a straightforward way for users to view and update these targets.

---

# 12. Gamification

Gamification is intended to encourage consistent use without dominating the product.

The system includes:

- Points.
- Streaks.
- Leaderboard ranking.

The system does not require:

- Levels.
- Virtual currency.
- Shops.
- Complex badge systems.
- Social challenges.
- Competitive health goals between users.

The primary purpose of gamification is to reward consistent engagement and completion.

---

# 13. Point Trigger System

The application shall support a predefined catalogue of point-earning triggers.

Examples may include:

- Completing the Daily Check-In.
- Completing a custom habit.
- Completing all active daily habits.
- Reaching the user's water target.
- Reaching the user's sleep target.
- Reaching a check-in streak milestone.
- Completing alcohol/sobriety tracking.

The final list of supported triggers may be adjusted before implementation.

## 13.1 Supported Trigger Registry

Supported triggers are defined by the backend application.

Each supported trigger should have:

- A unique machine-readable key.
- A human-readable name.
- A short description.
- Application logic that determines whether the condition has been met.

Conceptually:

```text
Trigger Key
    │
    ├── Display Name
    ├── Description
    └── Evaluation Logic
```

The backend registry defines what the application is technically capable of detecting.

Arbitrary trigger logic must not be entered by administrators or stored as executable database content.

## 13.2 Trigger Evaluation

Different triggers may require different data.

For example:

- A water-goal trigger evaluates the current Daily Check-In and the user's water target.
- A sleep-goal trigger evaluates sleep information and the user's target.
- A habit-completion trigger evaluates a habit's completion state.
- A streak trigger evaluates historical check-ins.

The implementation may provide trigger functions with the context required to evaluate these conditions.

The exact code structure belongs to the implementation design and is not prescribed by this specification.

---

# 14. Point Rules

A Point Rule connects a supported trigger to a configurable number of points.

A Point Rule shall include information such as:

- Supported trigger key.
- Point value.
- Enabled or disabled state.

Example:

```text
Trigger: DAILY_CHECKIN_COMPLETE
Points: 10
Enabled: Yes
```

The Point Rule does not define the trigger's implementation logic. It only configures the scoring behavior of a trigger the application already understands.

Normal users cannot modify Point Rules.

---

# 15. Administrative Point-Rule Management

The application shall provide a minimal administrator interface for Point Rules.

The administrator shall be able to:

- View all existing rules.
- Create a rule for a supported trigger.
- Change a rule's point value.
- Enable or disable a rule.
- Delete a rule.

When creating a rule, the administrator must select from triggers supported by the backend.

The interface should use a controlled selection rather than allowing arbitrary trigger names.

The backend must validate the requested trigger even if the frontend has already restricted the available options.

Unsupported triggers must be rejected.

A trigger should normally have no more than one corresponding Point Rule.

The administrator interface should remain intentionally small and focused on global scoring configuration.

---

# 16. Point Awards and Historical Scoring

When a user earns points, the system should preserve the amount that was actually awarded at that time.

For example:

```text
October 7
Daily Check-In completed
+10 points
```

If the administrator later changes the rule from 10 points to 15 points:

- Future qualifying actions should use the new value.
- Historical awards should remain unchanged.

Changing a Point Rule must not retroactively recalculate historical user scores.

Point-award history may be stored with the relevant Daily Check-In.

A Daily Check-In may therefore contain:

- Point awards earned on that day.
- Rule identifier or trigger key.
- Awarded point value.
- Daily point total.

The User model may also maintain a total points value for efficient leaderboard display.

The implementation document may decide whether the total is stored directly, calculated, or maintained as a cached value.

---

# 17. Streaks

The application shall support streaks.

The primary streak should represent consecutive days on which the user completed their Daily Check-In.

The product may also display streaks for individual habits if this can be supported without excessive complexity.

Examples:

```text
Current check-in streak: 12 days
Meditation streak: 7 days
```

Streak values should be derived from historical activity rather than requiring users to manually manage them.

Streak milestones may be used as supported point triggers.

---

# 18. Leaderboard

The application shall provide a leaderboard based on user points.

The leaderboard may display:

- Rank.
- Display name.
- Total points.
- Optionally, current check-in streak.

The leaderboard must not expose private wellness data.

Other users must not be able to view another person's:

- Sleep history.
- Water intake.
- Meals.
- Mood.
- Alcohol records.
- Bowel-movement records.
- Habit history.
- Personal targets.

Administrator accounts shall not appear in the normal leaderboard.

The system may provide a user setting allowing leaderboard participation to be disabled.

---

# 19. Dashboard / Today Experience

The main user experience should prioritize today's status.

A typical Today screen may contain:

```text
Today

Sleep              7h 30m
Water              1.4 / 2.0 L
Mood               Good
Meals              2 / 3
Alcohol            None
Bowel movement     Normal

Daily Habits

✓ Take vitamins
○ Exercise
✓ Meditate

Today's completion: 82%
Today's points: +17
Current streak: 8 days
```

The exact visual layout is not prescribed, but the user should be able to understand their current status quickly.

The interface should minimize the number of screens required to enter today's data.

---

# 20. Statistics and Insights

The application shall provide lightweight analytics based on the user's historical records.

Supported time ranges should include several useful presets, such as:

- Last 7 days.
- Last 30 days.
- Last 90 days.
- Custom range, if practical.

Useful statistics may include:

- Average sleep duration.
- Sleep trend.
- Sleep-goal completion rate.
- Water-intake trend.
- Water-goal completion rate.
- Mood trend.
- Alcohol-status distribution.
- Meal logging consistency.
- Bowel-movement frequency.
- Habit completion rate.
- Daily check-in consistency.
- Current and historical streak information.
- Points earned over time.

Simple relationships between tracked variables may be shown where they are meaningful and easy to understand.

Example:

> Average mood was higher on days following at least 7 hours of sleep.

These insights should remain descriptive rather than medical.

The application should use suitable charting and data-processing libraries where appropriate rather than implementing visualization primitives from scratch.

---

# 21. Navigation

The main user navigation should remain compact.

A suitable structure is:

- Today.
- Calendar.
- Insights.
- Leaderboard.
- Profile.

Habit management and wellness targets may be accessed from Profile or from contextually appropriate parts of the application.

Administrator users shall have access to the administration area.

The product should avoid creating separate top-level pages for every tracked health field unless required for usability.

---

# 22. User Interface and Experience Requirements

The application should feel like a modern consumer wellness product rather than a generic administrative dashboard.

The UI should prioritize:

- Clear hierarchy.
- Fast data entry.
- Responsive design.
- Strong mobile usability.
- Consistent spacing and typography.
- Smooth but restrained interactions.
- Clear loading states.
- Useful empty states.
- Immediate feedback after saving.
- Simple and readable charts.
- Clear calendar states.
- Accessible controls.
- Good contrast and readable text.
- Consistent interaction patterns.

The design should avoid unnecessary visual complexity such as:

- Excessive gradients.
- Heavy glassmorphism.
- Oversized decorative cards.
- Large sidebars with unnecessary navigation.
- Excessive animation.
- Decorative elements that interfere with usability.

Animations should support understanding rather than exist only for decoration.

---

# 23. Data Models

The application uses the following primary MongoDB models.

## 23.1 User

Purpose:

Stores identity, authentication-related account data, role, profile information, wellness targets, leaderboard preferences, and user-level scoring information.

Typical information includes:

- User identifier.
- Authentication credentials.
- Display name.
- Role.
- Wellness targets.
- Total points or scoring summary.
- Leaderboard participation preference.
- Creation/update timestamps.

User-related operations include:

- Registration.
- Viewing the authenticated user's profile.
- Updating profile information.
- Updating wellness targets.
- Deleting the user's account if account deletion is supported.

Sensitive authentication data must never be exposed through normal API responses.

## 23.2 DailyCheckIn

Purpose:

Stores the user's structured wellness record for one calendar date.

Typical information includes:

- Owner/user reference.
- Date.
- Sleep duration.
- Sleep quality.
- Water intake.
- Mood.
- Meals.
- Alcohol/sobriety status.
- Bowel-movement status.
- Habit completion states.
- Point awards earned for the day.
- Daily points total.
- Creation/update timestamps.

Supported operations include:

- Create a Daily Check-In.
- View a Daily Check-In.
- View check-ins across a date range.
- Update a Daily Check-In.
- Delete a Daily Check-In.

The system should prevent duplicate Daily Check-Ins for the same user and date unless the implementation has an equivalent mechanism that guarantees one logical record per day.

## 23.3 Habit

Purpose:

Stores custom daily habits created by users.

Typical information includes:

- Owner/user reference.
- Name.
- Optional short description.
- Active state.
- Creation/update timestamps.

Supported operations include:

- Create a habit.
- View habits.
- Edit a habit.
- Delete a habit.

Habits are always daily. Recurrence schedules are not required.

## 23.4 PointRule

Purpose:

Stores administrator-controlled scoring configuration for supported point triggers.

Typical information includes:

- Trigger key.
- Point value.
- Enabled state.
- Creation/update timestamps.

Supported operations include:

- Create a Point Rule.
- View Point Rules.
- Edit a Point Rule.
- Delete a Point Rule.
- Enable or disable a Point Rule.

Only administrators may modify Point Rules.

---

# 24. REST API Requirements

The Next.js backend shall expose a REST API used by the React frontend.

The API shall support CRUD operations for the application's persisted domain models where appropriate.

The API shall:

- Accept and return structured JSON data.
- Validate incoming requests.
- Return meaningful HTTP status codes.
- Enforce authentication.
- Enforce authorization.
- Enforce data ownership.
- Reject invalid model values.
- Reject unsupported point triggers.
- Prevent users from modifying another user's records.
- Prevent normal users from modifying administrator-only resources.

The exact endpoint naming scheme belongs to the implementation design.

---

# 25. Validation Requirements

The application should validate data on both the frontend and backend.

Backend validation is authoritative.

Examples include:

- Sleep duration must be within a plausible permitted range.
- Water intake must not be negative.
- Mood must be one of the supported values.
- Alcohol status must be one of the supported values.
- Bowel-movement status must be one of the supported values.
- Habit names must not be empty.
- Point values must follow defined numeric constraints.
- Point Rule triggers must exist in the supported trigger registry.
- Duplicate Point Rules for the same trigger should be prevented.
- A user must not create multiple logical Daily Check-Ins for the same date.

Frontend validation should help users correct mistakes before submission but must not replace backend validation.

---

# 26. Privacy and Data Access

Wellness data is private by default.

A standard user may access only their own:

- Daily Check-Ins.
- Habits.
- Targets.
- Point history.
- Statistics.

The leaderboard is a deliberately limited public view and should expose only information required for ranking.

The application should avoid exposing sensitive wellness data through:

- API responses.
- URLs.
- Frontend state belonging to other users.
- Leaderboard views.
- Administrative scoring screens.

---

# 27. Error Handling and User Feedback

The application should provide understandable feedback when operations fail.

Examples include:

- Login failure.
- Session expiration.
- Failed save.
- Invalid form data.
- Unauthorized access.
- Missing record.
- Duplicate record.
- Unsupported point trigger.
- Backend or network error.

The user should receive clear confirmation after successful create, edit, and delete operations.

Destructive operations should require appropriate confirmation when accidental deletion would be likely.

---

# 28. Loading and Empty States

The interface shall provide appropriate states while data is loading.

Examples include:

- Loading today's check-in.
- Loading calendar history.
- Loading statistics.
- Loading leaderboard.
- Loading habits.
- Loading administrative Point Rules.

Empty states should explain what the user can do next.

Examples:

- No habits yet: provide an action to create the first habit.
- No historical check-ins: encourage completing today's check-in.
- No Point Rules: administrator can add supported scoring rules.

The UI should not appear frozen or broken while data is being requested.

---

# 29. Responsive Design

The application shall be usable on:

- Desktop browsers.
- Tablet-sized screens.
- Mobile browsers.

Daily tracking controls should remain comfortable to use on narrow screens.

Important user actions should not depend on hover-only interactions.

The responsive design should preserve clarity rather than simply shrink desktop layouts.

---

# 30. Accessibility

The interface should follow reasonable accessibility practices, including:

- Semantic controls.
- Keyboard-accessible interaction.
- Visible focus states.
- Form labels.
- Sufficient contrast.
- Text alternatives where appropriate.
- Status information that is not conveyed by color alone.

Charts and visual indicators should have accompanying text where necessary to communicate essential information.

---

# 31. Performance Expectations

The application should feel responsive during normal use.

The frontend should avoid unnecessary blocking operations.

API responses should return only data needed for the requested view where practical.

Large historical datasets should be queried by relevant date ranges rather than always loading all records.

Charts and calendar views should remain smooth during normal interaction.

---

# 32. Security Requirements

The application should follow standard web-application security practices appropriate to the chosen stack.

At minimum:

- Passwords must never be stored as plaintext.
- Authentication credentials must not be exposed to the frontend beyond what is necessary.
- Protected backend routes must verify authentication.
- Administrator routes must verify role authorization.
- User-owned data operations must verify ownership.
- User input must be validated.
- Secrets and database credentials must not be committed to source control.
- Production traffic should use HTTPS.
- The frontend must not connect directly to MongoDB.

---

# 33. Deployment Requirements

The production system shall run on an Azure Virtual Machine.

The deployment shall include:

- React frontend.
- Next.js backend.
- Connectivity to MongoDB.
- Environment-specific configuration.
- Production-safe handling of secrets.
- A stable production URL.
- Processes that can be restarted reliably after VM or application restarts.

The frontend and backend may be exposed through a reverse proxy or equivalent production routing arrangement.

The exact deployment topology, process manager, proxy configuration, and CI/CD process belong to the implementation plan.

---

# 34. Expected Core User Flow

A normal daily user flow should be approximately:

```text
Login
  │
  ▼
Today
  │
  ├── Enter sleep
  ├── Enter water
  ├── Enter mood
  ├── Enter meals
  ├── Enter alcohol/sobriety status
  ├── Enter bowel-movement status
  └── Mark daily habits
  │
  ▼
Daily Check-In completion
  │
  ├── Evaluate point triggers
  ├── Award points
  ├── Update streak
  └── Update leaderboard score
  │
  ▼
Review progress
  │
  ├── Calendar
  ├── Insights
  └── Leaderboard
```

The user may return to any historical date to correct or complete its check-in.

---

# 35. Expected Administrator Flow

A typical administrator flow should be approximately:

```text
Login
  │
  ▼
Authorization check
  │
  ▼
Admin Point Rules
  │
  ├── View rules
  ├── Add rule from supported triggers
  ├── Change point value
  ├── Enable / disable rule
  └── Delete rule
  │
  ▼
Save changes
```

The administrator does not define executable trigger logic. The backend's supported trigger registry controls which triggers exist.

---

# 36. Product Principles

The final product should follow these principles:

1. **Today first.**\
   The current day's check-in is more important than historical maintenance.

2. **Structured rather than open-ended.**\
   The product captures defined wellness signals rather than becoming a journal.

3. **Fast interaction.**\
   Most daily inputs should require only a small number of actions.

4. **Private by default.**\
   Personal wellness information remains private unless explicitly represented in the limited leaderboard.

5. **Gamification supports consistency.**\
   Points and streaks motivate regular use without becoming the purpose of the product.

6. **Configuration is controlled.**\
   Administrators can configure point values but cannot introduce behavior the backend does not support.

7. **Historical data remains stable.**\
   Changing scoring rules affects future rewards, not rewards already earned.

8. **The product stays focused.**\
   Features that turn the application into a medical, nutrition, journaling, or social platform are outside the intended scope.

---

# 37. Final Functional Summary

The Wellness Tracker provides a single place for users to record structured daily wellness information, maintain custom daily habits, view their historical activity, understand simple personal trends, and stay motivated through points and streaks.

Its main functional areas are:

```text
Daily wellness tracking
        +
Custom daily habits
        +
Calendar and historical editing
        +
Personal targets
        +
Statistics and insights
        +
Points and streaks
        +
Leaderboard
        +
Administrator-controlled scoring rules
```

The system is delivered as a React frontend communicating with a separate Next.js REST backend backed by MongoDB and deployed on an Azure virtual machine.
